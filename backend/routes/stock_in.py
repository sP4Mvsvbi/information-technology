"""
routes/stock_in.py — Stock In transactions API endpoints.
"""

from flask import Blueprint, jsonify, request
from db import get_connection

stock_in_bp = Blueprint("stock_in", __name__, url_prefix="/api/stock-in")


def _serialize_stock_in(row: dict) -> dict:
    """Serialise datetime objects in the database row to strings."""
    for key in ("date_received", "created_at"):
        if row.get(key):
            row[key] = str(row[key])
    if row.get("unit_cost") is not None:
        row["unit_cost"] = float(row["unit_cost"])
    if row.get("total_cost") is not None:
        row["total_cost"] = float(row["total_cost"])
    return row


# ---------------------------------------------------------------------------
# GET /api/stock-in
# ---------------------------------------------------------------------------
@stock_in_bp.get("/")
def get_stock_in():
    """Return all incoming stock transactions, ordered by date desc."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_stock_in")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_stock_in(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# POST /api/stock-in
# ---------------------------------------------------------------------------
@stock_in_bp.post("/")
def create_stock_in():
    """
    Record a new incoming stock transaction.
    
    Expected JSON body:
    {
        "stock_in_id":   "SI005",
        "product_id":    "P001",
        "warehouse_id":  "W001",
        "supplier_id":   "S001",
        "user_id":       "U001",
        "quantity":      150,
        "unit_cost":     15.00,
        "date_received": "2026-06-19",
        "notes":         "Routine restocking"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("stock_in_id", "product_id", "warehouse_id", "supplier_id", "user_id", "quantity", "date_received")
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    unit_cost = data.get("unit_cost", 0.00)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_create_stock_in", (
            data["stock_in_id"],
            data["product_id"],
            data["warehouse_id"],
            data["supplier_id"],
            data["user_id"],
            data["quantity"],
            unit_cost,
            data["date_received"],
            data.get("notes", "")
        ))
        conn.commit()

        return jsonify({
            "message": "Stock In transaction recorded successfully",
            "stock_in_id": data["stock_in_id"]
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Duplicate entry" in msg:
            return jsonify({"error": "Stock In transaction ID already exists"}), 409
        if "foreign key constraint" in msg.lower():
            return jsonify({"error": "Invalid Product, Warehouse, Supplier, or User ID"}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()
