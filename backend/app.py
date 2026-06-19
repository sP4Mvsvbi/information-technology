"""
Inventory and Stock Control System - Backend API
Team: Mr. Beast
Framework: Flask
Database: MySQL (XAMPP)
All database operations use Stored Procedures (NO inline SQL)
"""

# type: ignore - Suppress type checker warnings for mysql.connector dictionary cursors
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import bcrypt
import os
from datetime import datetime, timedelta
import jwt
from functools import wraps
from typing import Any, Dict, List, Tuple, Union, Optional

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_EXPIRATION_HOURS'] = 24

# Database Configuration (XAMPP MySQL)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Default XAMPP password is empty
    'database': 'inventory_system',
    'port': 3306
}

# ============================================================================
# DATABASE CONNECTION
# ============================================================================

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None

def call_stored_procedure(proc_name: str, params: Optional[List[Any]] = None, fetch_one: bool = False, fetch_all: bool = True) -> Tuple[Union[Dict[str, Any], List[Dict[str, Any]]], int]:
    """
    Call a stored procedure and return results
    All database operations MUST use this function
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        if not connection:
            return {'error': 'Database connection failed'}, 500
        
        cursor = connection.cursor(dictionary=True)
        
        if params:
            cursor.callproc(proc_name, params)
        else:
            cursor.callproc(proc_name)
        
        # Fetch results - returns dict or list of dicts
        results: Union[Dict[str, Any], List[Dict[str, Any]], None] = None
        for result in cursor.stored_results():
            if fetch_one:
                results = result.fetchone()  # type: ignore  # Returns dict or None
            elif fetch_all:
                results = result.fetchall()  # type: ignore  # Returns list of dicts
        
        connection.commit()
        # Return empty list for fetch_all, empty dict for fetch_one if no results
        if results is not None:
            return results, 200
        else:
            return [] if fetch_all else {}, 200
        
    except Error as e:
        if connection:
            connection.rollback()
        error_msg = str(e)
        print(f"Stored procedure error: {error_msg}")
        return {'error': error_msg}, 400
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

# ============================================================================
# AUTHENTICATION MIDDLEWARE
# ============================================================================

def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login - calls stored procedure"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    print("Login attempt - Username:", username, "Password length:", len(password) if password else 0)
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    # Call stored procedure to get user
    result, status = call_stored_procedure('sp_get_user_by_username', [username], fetch_one=True)
    
    print("Stored procedure result - Status:", status, "Result type:", type(result), "Is list:", isinstance(result, list))
    print("Result data:", result)
    
    if status != 200 or not result or isinstance(result, list):
        print(f"Login failed - Invalid result")
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Type assertion for dictionary result
    user_data: Dict[str, Any] = result  # type: ignore
    
    # Verify password - support both plain text and bcrypt
    stored_password = user_data.get('hashed_password', '')
    password_valid = False
    
    print("Stored password:", stored_password, "Input password:", password)
    
    # Check if password is bcrypt hashed (starts with $2b$)
    if stored_password.startswith('$2b$') or stored_password.startswith('$2a$') or stored_password.startswith('$2y$'):
        try:
            # Verify bcrypt password
            password_valid = bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8'))
            print("Bcrypt check result:", password_valid)
        except Exception as e:
            print("Bcrypt verification error:", e)
            password_valid = False
    else:
        # Plain text comparison (for development/testing only)
        password_valid = (stored_password == password)
        print("Plain text check result:", password_valid)
    
    if not password_valid:
        print(f"Login failed - Password mismatch")
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user_data.get('user_id'),
        'username': user_data.get('username'),
        'role': user_data.get('role'),
        'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {
            'user_id': user_data.get('user_id'),
            'full_name': user_data.get('full_name'),
            'username': user_data.get('username'),
            'email': user_data.get('email'),
            'role': user_data.get('role')
        }
    }), 200

# ============================================================================
# CATEGORY ROUTES
# ============================================================================

@app.route('/api/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    """Get all categories"""
    results, status = call_stored_procedure('sp_get_all_categories')
    return jsonify(results), status

@app.route('/api/categories/<category_id>', methods=['GET'])
@token_required
def get_category(current_user, category_id):
    """Get category by ID"""
    result, status = call_stored_procedure('sp_get_category_by_id', [category_id], fetch_one=True)
    return jsonify(result), status

@app.route('/api/categories', methods=['POST'])
@token_required
def create_category(current_user):
    """Create new category"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_create_category', [
        data.get('category_id'),
        data.get('category_name'),
        data.get('description')
    ])
    return jsonify(result), status

@app.route('/api/categories/<category_id>', methods=['PUT'])
@token_required
def update_category(current_user, category_id):
    """Update category"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_update_category', [
        category_id,
        data.get('category_name'),
        data.get('description')
    ])
    return jsonify(result), status

@app.route('/api/categories/<category_id>', methods=['DELETE'])
@token_required
def delete_category(current_user, category_id):
    """Delete category"""
    result, status = call_stored_procedure('sp_delete_category', [category_id])
    return jsonify(result), status

# ============================================================================
# SUPPLIER ROUTES
# ============================================================================

@app.route('/api/suppliers', methods=['GET'])
@token_required
def get_suppliers(current_user):
    """Get all suppliers"""
    results, status = call_stored_procedure('sp_get_all_suppliers')
    return jsonify(results), status

@app.route('/api/suppliers/<supplier_id>', methods=['GET'])
@token_required
def get_supplier(current_user, supplier_id):
    """Get supplier by ID"""
    result, status = call_stored_procedure('sp_get_supplier_by_id', [supplier_id], fetch_one=True)
    return jsonify(result), status

@app.route('/api/suppliers', methods=['POST'])
@token_required
def create_supplier(current_user):
    """Create new supplier"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_create_supplier', [
        data.get('supplier_id'),
        data.get('supplier_name'),
        data.get('contact_number'),
        data.get('email'),
        data.get('address')
    ])
    return jsonify(result), status

@app.route('/api/suppliers/<supplier_id>', methods=['PUT'])
@token_required
def update_supplier(current_user, supplier_id):
    """Update supplier"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_update_supplier', [
        supplier_id,
        data.get('supplier_name'),
        data.get('contact_number'),
        data.get('email'),
        data.get('address')
    ])
    return jsonify(result), status

@app.route('/api/suppliers/<supplier_id>', methods=['DELETE'])
@token_required
def delete_supplier(current_user, supplier_id):
    """Delete supplier"""
    result, status = call_stored_procedure('sp_delete_supplier', [supplier_id])
    return jsonify(result), status

# ============================================================================
# WAREHOUSE ROUTES
# ============================================================================

@app.route('/api/warehouses', methods=['GET'])
@token_required
def get_warehouses(current_user):
    """Get all warehouses"""
    results, status = call_stored_procedure('sp_get_all_warehouses')
    return jsonify(results), status

@app.route('/api/warehouses/<warehouse_id>', methods=['GET'])
@token_required
def get_warehouse(current_user, warehouse_id):
    """Get warehouse by ID"""
    result, status = call_stored_procedure('sp_get_warehouse_by_id', [warehouse_id], fetch_one=True)
    return jsonify(result), status

@app.route('/api/warehouses', methods=['POST'])
@token_required
def create_warehouse(current_user):
    """Create new warehouse"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_create_warehouse', [
        data.get('warehouse_id'),
        data.get('warehouse_name'),
        data.get('location'),
        data.get('capacity', 0)
    ])
    return jsonify(result), status

@app.route('/api/warehouses/<warehouse_id>', methods=['PUT'])
@token_required
def update_warehouse(current_user, warehouse_id):
    """Update warehouse"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_update_warehouse', [
        warehouse_id,
        data.get('warehouse_name'),
        data.get('location'),
        data.get('capacity', 0)
    ])
    return jsonify(result), status

@app.route('/api/warehouses/<warehouse_id>', methods=['DELETE'])
@token_required
def delete_warehouse(current_user, warehouse_id):
    """Delete warehouse"""
    result, status = call_stored_procedure('sp_delete_warehouse', [warehouse_id])
    return jsonify(result), status

# ============================================================================
# PRODUCT ROUTES (with JOINs via stored procedures)
# ============================================================================

@app.route('/api/products', methods=['GET'])
@token_required
def get_products(current_user):
    """Get all products with category and supplier names (JOIN)"""
    results, status = call_stored_procedure('sp_get_all_products')
    return jsonify(results), status

@app.route('/api/products/<product_id>', methods=['GET'])
@token_required
def get_product(current_user, product_id):
    """Get product by ID with related data (JOIN)"""
    result, status = call_stored_procedure('sp_get_product_by_id', [product_id], fetch_one=True)
    return jsonify(result), status

@app.route('/api/products', methods=['POST'])
@token_required
def create_product(current_user):
    """Create new product"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_create_product', [
        data.get('product_id'),
        data.get('product_name'),
        data.get('description'),
        data.get('unit_price'),
        data.get('category_id'),
        data.get('supplier_id')
    ])
    return jsonify(result), status

@app.route('/api/products/<product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    """Update product"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_update_product', [
        product_id,
        data.get('product_name'),
        data.get('description'),
        data.get('unit_price'),
        data.get('category_id'),
        data.get('supplier_id')
    ])
    return jsonify(result), status

@app.route('/api/products/<product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    """Delete product"""
    result, status = call_stored_procedure('sp_delete_product', [product_id])
    return jsonify(result), status

# ============================================================================
# INVENTORY ROUTES (with JOINs via stored procedures)
# ============================================================================

@app.route('/api/inventory', methods=['GET'])
@token_required
def get_inventory(current_user):
    """Get all inventory with product and warehouse details (JOIN)"""
    results, status = call_stored_procedure('sp_get_all_inventory')
    return jsonify(results), status

@app.route('/api/inventory/low-stock', methods=['GET'])
@token_required
def get_low_stock(current_user):
    """Get low stock items (JOIN)"""
    results, status = call_stored_procedure('sp_get_low_stock_items')
    return jsonify(results), status

@app.route('/api/inventory/<inventory_id>/reorder-level', methods=['PUT'])
@token_required
def update_reorder_level(current_user, inventory_id):
    """Update inventory reorder level"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_update_inventory_reorder_level', [
        inventory_id,
        data.get('reorder_level')
    ])
    return jsonify(result), status

# ============================================================================
# STOCK TRANSACTION ROUTES (with JOINs and Transactions)
# ============================================================================

@app.route('/api/stock-in', methods=['GET'])
@token_required
def get_stock_in(current_user):
    """Get all stock in records with related data (JOIN)"""
    results, status = call_stored_procedure('sp_get_all_stock_in')
    return jsonify(results), status

@app.route('/api/stock-in', methods=['POST'])
@token_required
def create_stock_in(current_user):
    """Create stock in transaction"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_create_stock_in', [
        data.get('stock_in_id'),
        data.get('product_id'),
        data.get('warehouse_id'),
        data.get('supplier_id'),
        current_user,  # Use authenticated user
        data.get('quantity'),
        data.get('unit_cost'),
        data.get('date_received'),
        data.get('notes')
    ])
    return jsonify(result), status

@app.route('/api/stock-out', methods=['GET'])
@token_required
def get_stock_out(current_user):
    """Get all stock out records with related data (JOIN)"""
    results, status = call_stored_procedure('sp_get_all_stock_out')
    return jsonify(results), status

@app.route('/api/stock-out', methods=['POST'])
@token_required
def create_stock_out(current_user):
    """Create stock out transaction"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_create_stock_out', [
        data.get('stock_out_id'),
        data.get('product_id'),
        data.get('warehouse_id'),
        current_user,  # Use authenticated user
        data.get('quantity'),
        data.get('date_released'),
        data.get('destination'),
        data.get('notes')
    ])
    return jsonify(result), status

# ============================================================================
# USER ROUTES
# ============================================================================

@app.route('/api/users', methods=['GET'])
@token_required
def get_users(current_user):
    """Get all users"""
    results, status = call_stored_procedure('sp_get_all_users')
    return jsonify(results), status

@app.route('/api/users', methods=['POST'])
@token_required
def create_user(current_user):
    """Create new user"""
    data = request.get_json()
    # TODO: Hash password with bcrypt before storing
    result, status = call_stored_procedure('sp_create_user', [
        data.get('user_id'),
        data.get('full_name'),
        data.get('username'),
        data.get('email'),
        data.get('password'),  # TODO: Hash this
        data.get('role', 'Staff')
    ])
    return jsonify(result), status

@app.route('/api/users/<user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    """Update user"""
    data = request.get_json()
    result, status = call_stored_procedure('sp_update_user', [
        user_id,
        data.get('full_name'),
        data.get('email'),
        data.get('role')
    ])
    return jsonify(result), status

# ============================================================================
# DASHBOARD/ANALYTICS ROUTES (Complex JOINs)
# ============================================================================

@app.route('/api/dashboard/metrics', methods=['GET'])
@token_required
def get_dashboard_metrics(current_user):
    """Get dashboard metrics"""
    result, status = call_stored_procedure('sp_get_dashboard_metrics', fetch_one=True)
    return jsonify(result), status

@app.route('/api/dashboard/recent-transactions', methods=['GET'])
@token_required
def get_recent_transactions(current_user):
    """Get recent transactions (complex JOIN with UNION)"""
    limit = request.args.get('limit', 10, type=int)
    results, status = call_stored_procedure('sp_get_recent_transactions', [limit])
    return jsonify(results), status

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    connection = get_db_connection()
    if connection:
        connection.close()
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500

@app.route('/')
def index():
    """Root endpoint - API information"""
    return jsonify({
        'message': 'Inventory & Stock Control System API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'auth': '/api/auth/login',
            'categories': '/api/categories',
            'suppliers': '/api/suppliers',
            'warehouses': '/api/warehouses',
            'products': '/api/products',
            'inventory': '/api/inventory',
            'stock_in': '/api/stock-in',
            'stock_out': '/api/stock-out',
            'users': '/api/users',
            'dashboard': '/api/dashboard/metrics'
        },
        'frontend': 'Open index.html directly in browser or use a separate web server'
    }), 200

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("Inventory & Stock Control System - Backend API")
    print("=" * 60)
    print("Database: MySQL (XAMPP)")
    print("All operations use Stored Procedures")
    print("Server running on: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)

# Made with Bob
