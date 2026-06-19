"""
routes/suppliers.py — Suppliers API endpoints.

Endpoints
---------
GET    /api/suppliers              List all suppliers
GET    /api/suppliers/<id>         Get a supplier by ID
POST   /api/suppliers              Create a new supplier
PUT    /api/suppliers/<id>         Update an existing supplier
DELETE /api/suppliers/<id>         Delete a supplier
"""

from flask import Blueprint, jsonify, request
from db import get_connection

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/api/suppliers")


def _serialize_supplier(row: dict) -> dict:
    """Serialise datetime objects in the database row to strings."""
    for key in ("created_at", "updated_at"):
        if row.get(key):
            row[key] = str(row[key])
    return row


# ---------------------------------------------------------------------------
# GET /api/suppliers
# ---------------------------------------------------------------------------
@suppliers_bp.get("/")
def get_suppliers():
    """Return all suppliers, ordered by name."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_suppliers")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_supplier(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# GET /api/suppliers/<supplier_id>
# ---------------------------------------------------------------------------
@suppliers_bp.get("/<supplier_id>")
def get_supplier(supplier_id: str):
    """Retrieve a single supplier by ID."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_supplier_by_id", (supplier_id,))
        
        supplier = None
        for result in cursor.stored_results():
            supplier = result.fetchone()
            
        if not supplier:
            return jsonify({"error": "Supplier not found"}), 404
            
        return jsonify(_serialize_supplier(supplier))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# POST /api/suppliers
# ---------------------------------------------------------------------------
@suppliers_bp.post("/")
def create_supplier():
    """
    Create a new supplier.
    
    Expected JSON body:
    {
        "supplier_id":     "S003",
        "supplier_name":   "Supplier Name Ltd",
        "contact_number":  "09123456789",
        "email":           "supplier@example.com",
        "address":         "123 Street Address"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("supplier_id", "supplier_name", "contact_number", "email", "address")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_create_supplier", (
            data["supplier_id"],
            data["supplier_name"],
            data["contact_number"],
            data["email"],
            data["address"]
        ))
        conn.commit()

        return jsonify({
            "message": "Supplier created successfully",
            "supplier_id": data["supplier_id"]
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Duplicate entry" in msg:
            return jsonify({"error": "Supplier ID or Email already exists"}), 409
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# PUT /api/suppliers/<supplier_id>
# ---------------------------------------------------------------------------
@suppliers_bp.put("/<supplier_id>")
def update_supplier(supplier_id: str):
    """
    Update an existing supplier.
    
    Expected JSON body (all fields optional):
    {
        "supplier_name":   "New Name",
        "contact_number":  "09123456789",
        "email":           "new_email@example.com",
        "address":         "New Address"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Retrieve the existing supplier to preserve unchanged fields
        cursor.callproc("sp_get_supplier_by_id", (supplier_id,))
        current = None
        for result in cursor.stored_results():
            current = result.fetchone()

        if not current:
            return jsonify({"error": "Supplier not found"}), 404

        # Merge new data with current data
        supplier_name = data.get("supplier_name", current["supplier_name"])
        contact_number = data.get("contact_number", current["contact_number"])
        email = data.get("email", current["email"])
        address = data.get("address", current["address"])

        cursor.callproc("sp_update_supplier", (
            supplier_id,
            supplier_name,
            contact_number,
            email,
            address
        ))
        conn.commit()

        return jsonify({"message": "Supplier updated successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# DELETE /api/suppliers/<supplier_id>
# ---------------------------------------------------------------------------
@suppliers_bp.delete("/<supplier_id>")
def delete_supplier(supplier_id: str):
    """Delete a supplier."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify supplier exists
        cursor.execute("SELECT supplier_id FROM Supplier WHERE supplier_id = %s", (supplier_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Supplier not found"}), 404

        # Run stored procedure
        cursor.callproc("sp_delete_supplier", (supplier_id,))
        conn.commit()
        
        return jsonify({"message": "Supplier deleted successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        # If it failed due to existing products (SIGNAL SQLSTATE 45000)
        msg = str(e)
        if "Cannot delete supplier" in msg:
            return jsonify({"error": msg}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()
