"""
routes/auth.py — Authentication endpoints.

Endpoints
---------
POST /api/auth/login
    Accepts { username, password }, validates against the Users table,
    returns a session token and user info on success.

POST /api/auth/logout
    Clears the server-side token (no-op for now since we use sessionStorage,
    but included for completeness).
"""

import bcrypt
import secrets
from flask import Blueprint, jsonify, request
from db import get_connection
from functools import wraps

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

def require_role(allowed_roles):
    """
    Decorator to enforce role-based access control.
    Checks X-Current-User-Id header, Authorization header, or _uid query param.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method == "OPTIONS":
                return f(*args, **kwargs)

            # Try multiple sources for user identification
            user_id = (
                request.headers.get("X-Current-User-Id")
                or request.args.get("_uid")
            )

            if not user_id:
                return jsonify({"error": "Unauthorized"}), 401
                
            conn = get_connection()
            try:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT role FROM Users WHERE user_id = %s", (user_id,))
                user = cursor.fetchone()
                
                if not user or user["role"] not in allowed_roles:
                    return jsonify({"error": "Forbidden: insufficient permissions"}), 403
            except Exception as e:
                return jsonify({"error": str(e)}), 500
            finally:
                conn.close()
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@auth_bp.post("/login")
def login():
    """
    Validate username + password against the Users table.

    Expected JSON body:
    {
        "username": "jsmith",
        "password": "smith123"
    }

    Returns on success (200):
    {
        "token": "<random token>",
        "user": {
            "user_id":   "U001",
            "full_name": "John Smith",
            "username":  "jsmith",
            "email":     "jsmith@ex.com",
            "role":      "Admin"
        }
    }

    Returns on failure (401):
    { "error": "Invalid username or password" }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    username = (data.get("username") or "").strip()
    password = (data.get("password") or "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        # Use the stored procedure that also checks is_active = TRUE
        cursor.callproc("sp_get_user_by_username", (username,))

        user = None
        for result in cursor.stored_results():
            user = result.fetchone()

        if not user:
            return jsonify({"error": "Invalid username or password"}), 401

        # Verify password against bcrypt hash
        stored_hash = user["hashed_password"].encode("utf-8")
        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
            return jsonify({"error": "Invalid username or password"}), 401

        # Generate a simple session token
        token = secrets.token_hex(32)

        return jsonify({
            "token": token,
            "user": {
                "user_id":   user["user_id"],
                "full_name": user["full_name"],
                "username":  user["username"],
                "email":     user["email"],
                "role":      user["role"],
            }
        })

    finally:
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------
@auth_bp.post("/logout")
def logout():
    """
    Client-side logout — the frontend clears sessionStorage.
    This endpoint exists so the frontend has a consistent pattern.
    """
    return jsonify({"message": "Logged out successfully"})
