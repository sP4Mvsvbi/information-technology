"""
routes/products.py — Products API endpoints.
"""

from flask import Blueprint, jsonify, request
from db import get_connection

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


def _serialize_product(row: dict) -> dict:
    """Serialise datetime objects in the database row to strings."""
    for key in ("created_at", "updated_at"):
        if row.get(key):
            row[key] = str(row[key])
    if row.get("unit_price") is not None:
        row["unit_price"] = float(row["unit_price"])
    return row


# ---------------------------------------------------------------------------
# GET /api/products
# ---------------------------------------------------------------------------
@products_bp.get("/")
def get_products():
    """Return all products, ordered by name."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_products")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_product(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# GET /api/products/<product_id>
# ---------------------------------------------------------------------------
@products_bp.get("/<product_id>")
def get_product(product_id: str):
    """Retrieve a single product by ID."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_product_by_id", (product_id,))
        
        product = None
        for result in cursor.stored_results():
            product = result.fetchone()
            
        if not product:
            return jsonify({"error": "Product not found"}), 404
            
        return jsonify(_serialize_product(product))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# POST /api/products
# ---------------------------------------------------------------------------
@products_bp.post("/")
def create_product():
    """
    Create a new product.
    
    Expected JSON body:
    {
        "product_id":     "P005",
        "product_name":   "Product Name",
        "description":     "Product description",
        "unit_price":     150.50,
        "category_id":    "C001",
        "supplier_id":    "S001"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("product_id", "product_name", "unit_price", "category_id", "supplier_id")
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_create_product", (
            data["product_id"],
            data["product_name"],
            data.get("description", ""),
            data["unit_price"],
            data["category_id"],
            data["supplier_id"]
        ))
        conn.commit()

        return jsonify({
            "message": "Product created successfully",
            "product_id": data["product_id"]
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Duplicate entry" in msg:
            return jsonify({"error": "Product ID already exists"}), 409
        if "foreign key constraint" in msg.lower():
            return jsonify({"error": "Invalid Category ID or Supplier ID"}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# PUT /api/products/<product_id>
# ---------------------------------------------------------------------------
@products_bp.put("/<product_id>")
def update_product(product_id: str):
    """
    Update an existing product.
    
    Expected JSON body (all fields optional):
    {
        "product_name":   "Updated Name",
        "description":     "Updated desc",
        "unit_price":     160.00,
        "category_id":    "C001",
        "supplier_id":    "S001"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Retrieve the existing product to preserve unchanged fields
        cursor.callproc("sp_get_product_by_id", (product_id,))
        current = None
        for result in cursor.stored_results():
            current = result.fetchone()

        if not current:
            return jsonify({"error": "Product not found"}), 404

        product_name = data.get("product_name", current["product_name"])
        description = data.get("description", current["description"])
        unit_price = data.get("unit_price", current["unit_price"])
        category_id = data.get("category_id", current["category_id"])
        supplier_id = data.get("supplier_id", current["supplier_id"])

        cursor.callproc("sp_update_product", (
            product_id,
            product_name,
            description,
            unit_price,
            category_id,
            supplier_id
        ))
        conn.commit()

        return jsonify({"message": "Product updated successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "foreign key constraint" in msg.lower():
            return jsonify({"error": "Invalid Category ID or Supplier ID"}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# DELETE /api/products/<product_id>
# ---------------------------------------------------------------------------
@products_bp.delete("/<product_id>")
def delete_product(product_id: str):
    """Delete a product."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify product exists
        cursor.execute("SELECT product_id FROM Product WHERE product_id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Product not found"}), 404

        # Run stored procedure
        cursor.callproc("sp_delete_product", (product_id,))
        conn.commit()
        
        return jsonify({"message": "Product deleted successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Cannot delete product" in msg:
            return jsonify({"error": msg}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()
