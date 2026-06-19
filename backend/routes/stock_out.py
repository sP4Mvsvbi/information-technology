"""
routes/stock_out.py — Stock Out transactions API endpoints.
"""

from flask import Blueprint, jsonify, request
from db import get_connection
from .auth import require_role

stock_out_bp = Blueprint("stock_out", __name__, url_prefix="/api/stock-out")


def _serialize_stock_out(row: dict) -> dict:
    """Serialise datetime objects in the database row to strings."""
    for key in ("date_released", "created_at"):
        if row.get(key):
            row[key] = str(row[key])
    return row


# ---------------------------------------------------------------------------
# GET /api/stock-out
# ---------------------------------------------------------------------------
@stock_out_bp.get("/")
@require_role(["Manager"])
def get_stock_out():
    """Return all outgoing stock transactions, ordered by date desc."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_stock_out")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_stock_out(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# POST /api/stock-out
# ---------------------------------------------------------------------------
@stock_out_bp.post("/")
@require_role(["Manager"])
def create_stock_out():
    """
    Record a new outgoing stock transaction.
    
    Expected JSON body:
    {
        "stock_out_id":   "SO005",
        "product_id":     "P001",
        "warehouse_id":   "W001",
        "user_id":        "U001",
        "quantity":       10,
        "date_released":  "2026-06-19",
        "destination":    "Branch office",
        "notes":          "Weekly supply delivery"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("stock_out_id", "product_id", "warehouse_id", "user_id", "quantity", "date_released", "destination")
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_create_stock_out", (
            data["stock_out_id"],
            data["product_id"],
            data["warehouse_id"],
            data["user_id"],
            data["quantity"],
            data["date_released"],
            data["destination"],
            data.get("notes", "")
        ))
        conn.commit()

        return jsonify({
            "message": "Stock Out transaction recorded successfully",
            "stock_out_id": data["stock_out_id"]
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Duplicate entry" in msg:
            return jsonify({"error": "Stock Out transaction ID already exists"}), 409
        if "foreign key constraint" in msg.lower():
            return jsonify({"error": "Invalid Product, Warehouse, or User ID"}), 400
        if "Insufficient stock" in msg or "Inventory record not found" in msg:
            return jsonify({"error": msg}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()
