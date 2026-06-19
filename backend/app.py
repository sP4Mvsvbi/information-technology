"""
app.py — Flask application factory.

Creates and configures the Flask app, registers blueprints, and sets up CORS
so the frontend (served on a different port by main.py) can call the API.

Run with:
    python app.py
"""

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.users import users_bp
from routes.suppliers import suppliers_bp
from routes.categories import categories_bp
from routes.products import products_bp
from routes.warehouses import warehouses_bp
from routes.inventory import inventory_bp
from routes.stock_in import stock_in_bp
from routes.stock_out import stock_out_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    app.url_map.strict_slashes = False

    # ------------------------------------------------------------------
    # CORS — allow the frontend origin defined in .env to call the API
    # ------------------------------------------------------------------
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.FRONTEND_ORIGIN,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    })

    # ------------------------------------------------------------------
    # Register blueprints
    # ------------------------------------------------------------------
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(warehouses_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(stock_in_bp)
    app.register_blueprint(stock_out_bp)

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    # ------------------------------------------------------------------
    # Generic error handlers
    # ------------------------------------------------------------------
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    print()
    print("  Inventory Backend API")
    print("  =====================")
    print("  Running at: http://localhost:5000")
    print("  Health:     http://localhost:5000/api/health")
    print()
    print("  Routes:")
    print("    POST /api/auth/login")
    print("    POST /api/auth/logout")
    print()
    print("    GET  /api/dashboard/metrics")
    print("    GET  /api/dashboard/recent-transactions")
    print("    GET  /api/dashboard/products")
    print("    GET  /api/dashboard/inventory")
    print("    GET  /api/dashboard/warehouses")
    print("    GET  /api/dashboard/suppliers")
    print("    GET  /api/dashboard/stock-in")
    print("    GET  /api/dashboard/stock-out")
    print()
    print("    GET    /api/users/")
    print("    POST   /api/users/")
    print("    PUT    /api/users/<user_id>")
    print("    DELETE /api/users/<user_id>")
    print()
    print("    GET    /api/suppliers/")
    print("    POST   /api/suppliers/")
    print("    PUT    /api/suppliers/<supplier_id>")
    print("    DELETE /api/suppliers/<supplier_id>")
    print()
    print("    GET    /api/categories/")
    print("    POST   /api/categories/")
    print("    PUT    /api/categories/<category_id>")
    print("    DELETE /api/categories/<category_id>")
    print()
    print("    GET    /api/products/")
    print("    POST   /api/products/")
    print("    PUT    /api/products/<product_id>")
    print("    DELETE /api/products/<product_id>")
    print()
    print("    GET    /api/warehouses/")
    print("    POST   /api/warehouses/")
    print("    PUT    /api/warehouses/<warehouse_id>")
    print("    DELETE /api/warehouses/<warehouse_id>")
    print()
    print("    GET    /api/inventory/")
    print("    GET    /api/inventory/low-stock")
    print("    PUT    /api/inventory/<inventory_id>")
    print()
    print("    GET    /api/stock-in/")
    print("    POST   /api/stock-in/")
    print()
    print("    GET    /api/stock-out/")
    print("    POST   /api/stock-out/")
    print()
    print("  Press Ctrl+C to stop.")
    print()
    app.run(host="localhost", port=5000, debug=Config.DEBUG)
