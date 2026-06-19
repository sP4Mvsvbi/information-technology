"""
routes/users.py — Users API endpoints.

Endpoints
---------
GET    /api/users              List all users (no password hash)
POST   /api/users              Create a new user
PUT    /api/users/<user_id>    Update full_name, email, role
DELETE /api/users/<user_id>    Delete a user

Password hashing uses bcrypt.
All writes go through the stored procedures in stored_procedures.sql.
"""

import bcrypt
from flask import Blueprint, jsonify, request
from db import get_connection

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_user(row: dict) -> dict:
    """Remove sensitive fields and serialise timestamps."""
    row.pop("hashed_password", None)
    for key in ("created_at", "updated_at"):
        if row.get(key):
            row[key] = str(row[key])
    return row


def _next_user_id(cursor) -> str:
    """Generate the next user_id as U001, U002, ... based on max existing ID."""
    cursor.execute("SELECT user_id FROM Users ORDER BY user_id DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return "U001"
    last_num = int(row["user_id"][1:])
    return f"U{str(last_num + 1).zfill(3)}"


# ---------------------------------------------------------------------------
# GET /api/users
# ---------------------------------------------------------------------------
@users_bp.get("/")
def get_users():
    """Return all active users, password hash excluded."""
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT user_id, full_name, username, email, role, is_active, created_at, updated_at "
            "FROM Users WHERE is_active = TRUE ORDER BY full_name"
        )
        rows = cursor.fetchall()
        return jsonify([_serialize_user(r) for r in rows])
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/users
# ---------------------------------------------------------------------------
@users_bp.post("/")
def create_user():
    """
    Create a new user.

    Expected JSON body:
    {
        "full_name": "John Doe",
        "username":  "johndoe",
        "email":     "john@example.com",
        "password":  "plaintext_password",
        "role":      "Manager"          // Admin | Manager
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("full_name", "username", "email", "password", "role")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    valid_roles = ("Admin", "Manager")
    if data["role"] not in valid_roles:
        return jsonify({"error": f"role must be one of: {', '.join(valid_roles)}"}), 400

    # Hash the password
    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        user_id = _next_user_id(cursor)

        cursor.callproc("sp_create_user", (
            user_id,
            data["full_name"],
            data["username"],
            data["email"],
            hashed,
            data["role"],
        ))
        conn.commit()

        return jsonify({
            "message": "User created successfully",
            "user_id": user_id,
        }), 201

    except Exception as e:
        conn.rollback()
        # Duplicate username/email gives a MySQL integrity error
        msg = str(e)
        if "Duplicate entry" in msg:
            field = "username" if "username" in msg else "email"
            return jsonify({"error": f"That {field} is already taken"}), 409
        return jsonify({"error": msg}), 500
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# PUT /api/users/<user_id>
# ---------------------------------------------------------------------------
@users_bp.put("/<user_id>")
def update_user(user_id: str):
    """
    Update a user's full_name, email, and/or role.
    Password changes are not handled here (separate endpoint if needed).

    Expected JSON body (all fields optional):
    {
        "full_name": "Jane Smith",
        "email":     "jane@example.com",
        "role":      "Manager"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # Fetch current values so we can keep unchanged fields intact
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_users")
        all_users = []
        for result in cursor.stored_results():
            all_users = result.fetchall()

        current = next((u for u in all_users if u["user_id"] == user_id), None)
        if not current:
            return jsonify({"error": "User not found"}), 404

        full_name = data.get("full_name", current["full_name"])
        email     = data.get("email",     current["email"])
        role      = data.get("role",      current["role"])

        valid_roles = ("Admin", "Manager")
        if role not in valid_roles:
            return jsonify({"error": f"role must be one of: {', '.join(valid_roles)}"}), 400

        cursor.callproc("sp_update_user", (user_id, full_name, email, role))
        conn.commit()

        return jsonify({"message": "User updated successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# DELETE /api/users/<user_id>
# ---------------------------------------------------------------------------
@users_bp.delete("/<user_id>")
def delete_user(user_id: str):
    """
    Delete a user:
    - Hard delete if they have no linked Stock_In / Stock_Out records.
    - Soft delete (is_active = FALSE) if transaction history exists,
      so audit trails stay intact.
    - The frontend also prevents deleting yourself, but we enforce it
      here too via the X-Current-User-Id header.
    """
    # Block self-delete — frontend sends the logged-in user's ID in a header
    current_user_id = request.headers.get("X-Current-User-Id", "")
    if current_user_id and current_user_id == user_id:
        return jsonify({"error": "You cannot delete your own account"}), 403

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        # Verify user exists
        cursor.execute("SELECT user_id FROM Users WHERE user_id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"error": "User not found"}), 404

        # Check if user has any linked transactions
        cursor.execute(
            """SELECT
                (SELECT COUNT(*) FROM Stock_In  WHERE user_id = %s) +
                (SELECT COUNT(*) FROM Stock_Out WHERE user_id = %s) AS total
            """,
            (user_id, user_id)
        )
        total = cursor.fetchone()["total"]

        if total > 0:
            # Soft delete — preserve transaction history
            cursor.execute(
                "UPDATE Users SET is_active = FALSE WHERE user_id = %s", (user_id,)
            )
            message = "User deactivated (has transaction history)"
        else:
            # Hard delete — no linked records
            cursor.execute("DELETE FROM Users WHERE user_id = %s", (user_id,))
            message = "User deleted successfully"

        conn.commit()
        return jsonify({"message": message})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
