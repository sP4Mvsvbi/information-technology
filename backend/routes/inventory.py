"""
routes/inventory.py — Inventory API endpoints.
"""

from flask import Blueprint, jsonify, request
from db import get_connection
from .auth import require_role

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


def _serialize_inventory(row: dict) -> dict:
    """Serialise datetime objects in the database row to strings."""
    if row.get("last_updated"):
        row["last_updated"] = str(row["last_updated"])
    if row.get("unit_price") is not None:
        row["unit_price"] = float(row["unit_price"])
    return row


# ---------------------------------------------------------------------------
# GET /api/inventory
# ---------------------------------------------------------------------------
@inventory_bp.get("/")
@require_role(["Manager"])
def get_inventory():
    """Return all inventory items with product and warehouse names."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_inventory")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_inventory(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# GET /api/inventory/low-stock
# ---------------------------------------------------------------------------
@inventory_bp.get("/low-stock")
@require_role(["Manager"])
def get_low_stock():
    """Return all low stock inventory items."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_low_stock_items")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_inventory(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# PUT /api/inventory/<inventory_id>
# ---------------------------------------------------------------------------
@inventory_bp.put("/<inventory_id>")
@require_role(["Manager"])
def update_inventory(inventory_id: str):
    """
    Directly update inventory quantity on hand and reorder level.
    (Used for corrections and manual adjustments).
    
    Expected JSON body:
    {
        "quantity_on_hand": 350,
        "reorder_level": 100
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("quantity_on_hand", "reorder_level")
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify inventory record exists
        cursor.execute("SELECT inventory_id FROM Inventory WHERE inventory_id = %s", (inventory_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Inventory record not found"}), 404

        # Execute direct update
        cursor.execute(
            "UPDATE Inventory SET quantity_on_hand = %s, reorder_level = %s WHERE inventory_id = %s",
            (data["quantity_on_hand"], data["reorder_level"], inventory_id)
        )
        conn.commit()

        return jsonify({"message": "Inventory record updated successfully"})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
