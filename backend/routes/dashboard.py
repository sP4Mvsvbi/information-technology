"""
routes/dashboard.py — Dashboard API endpoints.

Endpoints
---------
GET /api/dashboard/metrics
    Returns counts used by the four metric cards:
      - total_products
      - low_stock_count
      - total_suppliers
      - total_warehouses

GET /api/dashboard/recent-transactions
    Returns the 6 most recent combined Stock_In + Stock_Out records,
    sorted by date descending. Each row includes a 'type' field ('IN' or 'OUT'),
    a unified 'id', 'product_id', 'warehouse_id', 'quantity', and 'date'
    so dashboard.js can render them without any changes.
"""

from flask import Blueprint, jsonify
from db import get_connection

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


# ---------------------------------------------------------------------------
# GET /api/dashboard/metrics
# ---------------------------------------------------------------------------
@dashboard_bp.get("/metrics")
def get_metrics():
    """
    Returns the four summary counts shown on the dashboard metric cards.
    Uses sp_get_dashboard_metrics stored procedure.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_dashboard_metrics")

        # callproc stores result sets — iterate to fetch
        metrics = {}
        for result in cursor.stored_results():
            row = result.fetchone()
            if row:
                metrics = row

        return jsonify({
            "total_products":  metrics.get("total_products", 0),
            "low_stock_count": metrics.get("low_stock_items", 0),
            "total_suppliers": metrics.get("total_suppliers", 0),
            "total_warehouses": metrics.get("total_warehouses", 0),
        })
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# GET /api/dashboard/recent-transactions
# ---------------------------------------------------------------------------
@dashboard_bp.get("/recent-transactions")
def get_recent_transactions():
    """
    Returns the 6 most recent stock transactions (IN + OUT combined).
    Shape matches what dashboard.js expects so it can keep using joinById
    with the product/warehouse data it already loads separately.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        # Combine Stock_In and Stock_Out, sort by date, take top 6
        sql = """
            SELECT
                'IN'              AS type,
                si.stock_in_id    AS id,
                si.product_id,
                si.warehouse_id,
                si.quantity,
                si.date_received  AS date
            FROM Stock_In si

            UNION ALL

            SELECT
                'OUT'             AS type,
                so.stock_out_id   AS id,
                so.product_id,
                so.warehouse_id,
                so.quantity,
                so.date_released  AS date
            FROM Stock_Out so

            ORDER BY date DESC
            LIMIT 6
        """
        cursor.execute(sql)
        rows = cursor.fetchall()

        # Convert date objects to ISO strings for JSON serialisation
        for row in rows:
            if row.get("date"):
                row["date"] = str(row["date"])

        return jsonify(rows)
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# GET /api/dashboard/products
# GET /api/dashboard/inventory
# GET /api/dashboard/warehouses
# GET /api/dashboard/suppliers
# GET /api/dashboard/stock-in
# GET /api/dashboard/stock-out
#
# dashboard.js loads all six datasets in parallel via Promise.all.
# These thin endpoints delegate to the stored procedures already defined
# in stored_procedures.sql so nothing is duplicated.
# ---------------------------------------------------------------------------

@dashboard_bp.get("/products")
def get_products():
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_products")
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        return jsonify(rows)
    finally:
        conn.close()


@dashboard_bp.get("/inventory")
def get_inventory():
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_inventory")
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        # Convert timestamps
        for row in rows:
            if row.get("last_updated"):
                row["last_updated"] = str(row["last_updated"])
        return jsonify(rows)
    finally:
        conn.close()


@dashboard_bp.get("/warehouses")
def get_warehouses():
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_warehouses")
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for row in rows:
            for key in ("created_at", "updated_at"):
                if row.get(key):
                    row[key] = str(row[key])
        return jsonify(rows)
    finally:
        conn.close()


@dashboard_bp.get("/suppliers")
def get_suppliers():
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_suppliers")
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for row in rows:
            for key in ("created_at", "updated_at"):
                if row.get(key):
                    row[key] = str(row[key])
        return jsonify(rows)
    finally:
        conn.close()


@dashboard_bp.get("/stock-in")
def get_stock_in():
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_stock_in")
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for row in rows:
            for key in ("date_received", "created_at"):
                if row.get(key):
                    row[key] = str(row[key])
        return jsonify(rows)
    finally:
        conn.close()


@dashboard_bp.get("/stock-out")
def get_stock_out():
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("sp_get_all_stock_out")
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for row in rows:
            for key in ("date_released", "created_at"):
                if row.get(key):
                    row[key] = str(row[key])
        return jsonify(rows)
    finally:
        conn.close()
