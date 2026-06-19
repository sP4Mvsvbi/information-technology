"""
routes/categories.py — Categories API endpoints.
"""

from flask import Blueprint, jsonify, request
from db import get_connection

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


def _serialize_category(row: dict) -> dict:
    """Serialise datetime objects in the database row to strings."""
    for key in ("created_at", "updated_at"):
        if row.get(key):
            row[key] = str(row[key])
    return row


# ---------------------------------------------------------------------------
# GET /api/categories
# ---------------------------------------------------------------------------
@categories_bp.get("/")
def get_categories():
    """Return all categories, ordered by name."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_categories")
        
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            
        return jsonify([_serialize_category(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# GET /api/categories/<category_id>
# ---------------------------------------------------------------------------
@categories_bp.get("/<category_id>")
def get_category(category_id: str):
    """Retrieve a single category by ID."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_category_by_id", (category_id,))
        
        category = None
        for result in cursor.stored_results():
            category = result.fetchone()
            
        if not category:
            return jsonify({"error": "Category not found"}), 404
            
        return jsonify(_serialize_category(category))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# POST /api/categories
# ---------------------------------------------------------------------------
@categories_bp.post("/")
def create_category():
    """
    Create a new category.
    
    Expected JSON body:
    {
        "category_id":     "C003",
        "category_name":   "New Category Name",
        "description":     "Category description"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ("category_id", "category_name")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_create_category", (
            data["category_id"],
            data["category_name"],
            data.get("description", "")
        ))
        conn.commit()

        return jsonify({
            "message": "Category created successfully",
            "category_id": data["category_id"]
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Duplicate entry" in msg:
            return jsonify({"error": "Category ID or Name already exists"}), 409
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# PUT /api/categories/<category_id>
# ---------------------------------------------------------------------------
@categories_bp.put("/<category_id>")
def update_category(category_id: str):
    """
    Update an existing category.
    
    Expected JSON body (all fields optional):
    {
        "category_name":   "Updated Name",
        "description":     "Updated description"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Retrieve the existing category to preserve unchanged fields
        cursor.callproc("sp_get_category_by_id", (category_id,))
        current = None
        for result in cursor.stored_results():
            current = result.fetchone()

        if not current:
            return jsonify({"error": "Category not found"}), 404

        category_name = data.get("category_name", current["category_name"])
        description = data.get("description", current["description"])

        cursor.callproc("sp_update_category", (
            category_id,
            category_name,
            description
        ))
        conn.commit()

        return jsonify({"message": "Category updated successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# DELETE /api/categories/<category_id>
# ---------------------------------------------------------------------------
@categories_bp.delete("/<category_id>")
def delete_category(category_id: str):
    """Delete a category."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify category exists
        cursor.execute("SELECT category_id FROM Category WHERE category_id = %s", (category_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Category not found"}), 404

        # Run stored procedure
        cursor.callproc("sp_delete_category", (category_id,))
        conn.commit()
        
        return jsonify({"message": "Category deleted successfully"})

    except Exception as e:
        if conn:
            conn.rollback()
        msg = str(e)
        if "Cannot delete category" in msg:
            return jsonify({"error": msg}), 400
        return jsonify({"error": msg}), 500
    finally:
        if conn:
            conn.close()
