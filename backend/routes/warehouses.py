"""
routes/warehouses.py — Warehouses API endpoints.
"""

from flask import Blueprint, jsonify, request
from db import get_connection
from .auth import require_role

warehouses_bp = Blueprint("warehouses", __name__, url_prefix="/api/warehouses")


def _serialize_warehouse(row: dict) -> dict:
    """Serialise datetime objects in the database row to strings."""
    for key in ("created_at", "updated_at"):
        if row.get(key):
            row[key] = str(row[key])
    return row


# ---------------------------------------------------------------------------
# GET /api/warehouses
# ---------------------------------------------------------------------------
@warehouses_bp.get("/")
@require_role(["Manager"])
def get_warehouses():
    """Return all warehouses, ordered by name."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_warehouses")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_warehouse(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# GET /api/warehouses/<warehouse_id>
# ---------------------------------------------------------------------------
@warehouses_bp.get("/<warehouse_id>")
@require_role(["Manager"])
def get_warehouse(warehouse_id: str):
    """Retrieve a single warehouse by ID."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_warehouse_by_id", (warehouse_id,))
        
        warehouse = None
        for result in cursor.stored_results():
            warehouse = result.fetchone()
            
        if not warehouse:
            return jsonify({"error": "Warehouse not found"}), 404
            
        return jsonify(_serialize_warehouse(warehouse))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# POST /api/warehouses
# ---------------------------------------------------------------------------
@warehouses_bp.post("/")
@require_role(["Manager"])
def create_warehouse():
    """
    Create a new warehouse.
    
    Expected JSON body:
    {
        "warehouse_id":     "W003",
        "warehouse_name":   "New Warehouse Name",
        "location":         "New Location",
        "capacity":         5000
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("warehouse_id", "warehouse_name", "location")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_create_warehouse", (
            data["warehouse_id"],
            data["warehouse_name"],
            data["location"],
            data.get("capacity", 0)
        ))
        conn.commit()

        return jsonify({
            "message": "Warehouse created successfully",
            "warehouse_id": data["warehouse_id"]
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Duplicate entry" in msg:
            return jsonify({"error": "Warehouse ID or Name already exists"}), 409
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# PUT /api/warehouses/<warehouse_id>
# ---------------------------------------------------------------------------
@warehouses_bp.put("/<warehouse_id>")
@require_role(["Manager"])
def update_warehouse(warehouse_id: str):
    """
    Update an existing warehouse.
    
    Expected JSON body (all fields optional):
    {
        "warehouse_name":   "Updated Name",
        "location":         "Updated Location",
        "capacity":         6000
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Retrieve the existing warehouse to preserve unchanged fields
        cursor.callproc("sp_get_warehouse_by_id", (warehouse_id,))
        current = None
        for result in cursor.stored_results():
            current = result.fetchone()

        if not current:
            return jsonify({"error": "Warehouse not found"}), 404

        warehouse_name = data.get("warehouse_name", current["warehouse_name"])
        location = data.get("location", current["location"])
        capacity = data.get("capacity", current["capacity"])

        cursor.callproc("sp_update_warehouse", (
            warehouse_id,
            warehouse_name,
            location,
            capacity
        ))
        conn.commit()

        return jsonify({"message": "Warehouse updated successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# DELETE /api/warehouses/<warehouse_id>
# ---------------------------------------------------------------------------
@warehouses_bp.delete("/<warehouse_id>")
@require_role(["Manager"])
def delete_warehouse(warehouse_id: str):
    """Delete a warehouse."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify warehouse exists
        cursor.execute("SELECT warehouse_id FROM Warehouse WHERE warehouse_id = %s", (warehouse_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Warehouse not found"}), 404

        # Run stored procedure
        cursor.callproc("sp_delete_warehouse", (warehouse_id,))
        conn.commit()
        
        return jsonify({"message": "Warehouse deleted successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Cannot delete warehouse" in msg:
            return jsonify({"error": msg}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()
