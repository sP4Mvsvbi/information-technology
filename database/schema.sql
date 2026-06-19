-- ============================================================================
-- INVENTORY AND STOCK CONTROL SYSTEM - DATABASE SCHEMA
-- Team: Mr. Beast
-- Normalization Level: Third Normal Form (3NF)
-- Database: MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

-- Drop existing database if exists and create new one
DROP DATABASE IF EXISTS inventory_system;
CREATE DATABASE inventory_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_system;

-- ============================================================================
-- TABLE 1: Category
-- Purpose: Organize products into logical categories
-- Normalization: 3NF - No transitive dependencies
-- ============================================================================
CREATE TABLE Category (
    category_id VARCHAR(10) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_name (category_name)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 2: Supplier
-- Purpose: Store supplier contact and business information
-- Normalization: 3NF - All non-key attributes depend only on primary key
-- ============================================================================
CREATE TABLE Supplier (
    supplier_id VARCHAR(10) PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_name (supplier_name),
    INDEX idx_supplier_email (email)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 3: Warehouse
-- Purpose: Track physical storage locations
-- Normalization: 3NF - Simple entity with no dependencies
-- ============================================================================
CREATE TABLE Warehouse (
    warehouse_id VARCHAR(10) PRIMARY KEY,
    warehouse_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    capacity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_warehouse_name (warehouse_name)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 4: Users
-- Purpose: System users with role-based access
-- Normalization: 3NF - User attributes depend only on user_id
-- ============================================================================
CREATE TABLE Users (
    user_id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Manager', 'Staff') NOT NULL DEFAULT 'Staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 5: Product
-- Purpose: Store product master data
-- Normalization: 3NF - Product attributes depend only on product_id
-- Relationships: 1:M from Category, 1:M from Supplier
-- ============================================================================
CREATE TABLE Product (
    product_id VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    category_id VARCHAR(10) NOT NULL,
    supplier_id VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_product_name (product_name),
    INDEX idx_category_id (category_id),
    INDEX idx_supplier_id (supplier_id)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 6: Inventory
-- Purpose: Track current stock levels per product per warehouse
-- Normalization: 3NF - Separated from Product to avoid redundancy
-- Relationships: 1:M from Product, 1:M from Warehouse
-- ============================================================================
CREATE TABLE Inventory (
    inventory_id VARCHAR(10) PRIMARY KEY,
    product_id VARCHAR(10) NOT NULL,
    warehouse_id VARCHAR(10) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_level INT NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_product_warehouse (product_id, warehouse_id),
    INDEX idx_product_id (product_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_low_stock (quantity_on_hand, reorder_level)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 7: Stock_In
-- Purpose: Record incoming stock transactions
-- Normalization: 3NF - Separated from Stock_Out due to different attributes
-- Relationships: 1:M from Product, Warehouse, Supplier, Users
-- ============================================================================
CREATE TABLE Stock_In (
    stock_in_id VARCHAR(10) PRIMARY KEY,
    product_id VARCHAR(10) NOT NULL,
    warehouse_id VARCHAR(10) NOT NULL,
    supplier_id VARCHAR(10) NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10, 2) CHECK (unit_cost >= 0),
    date_received DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_supplier_id (supplier_id),
    INDEX idx_user_id (user_id),
    INDEX idx_date_received (date_received)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 8: Stock_Out
-- Purpose: Record outgoing stock transactions
-- Normalization: 3NF - Separated from Stock_In due to different attributes
-- Relationships: 1:M from Product, Warehouse, Users
-- ============================================================================
CREATE TABLE Stock_Out (
    stock_out_id VARCHAR(10) PRIMARY KEY,
    product_id VARCHAR(10) NOT NULL,
    warehouse_id VARCHAR(10) NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    date_released DATE NOT NULL,
    destination VARCHAR(200) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_user_id (user_id),
    INDEX idx_date_released (date_released)
) ENGINE=InnoDB;

-- ============================================================================
-- INITIAL DATA POPULATION
-- ============================================================================

-- Insert Categories
INSERT INTO Category (category_id, category_name, description) VALUES
('C001', 'Office Supplies', 'General office and stationery items'),
('C002', 'Tools', 'Hardware and maintenance tools');

-- Insert Suppliers
INSERT INTO Supplier (supplier_id, supplier_name, contact_number, email, address) VALUES
('S001', 'ABC Company', '09123456780', 'abccompany@ex.com', 'Pulong Buhangin'),
('S002', 'XYZ Corp.', '09123456780', 'xyzcorporation@ex.com', 'Pulong Buhangin');

-- Insert Warehouses
INSERT INTO Warehouse (warehouse_id, warehouse_name, location, capacity) VALUES
('W001', 'Main Warehouse', 'Caypombo', 10000),
('W002', 'Branch Warehouse', 'Poblacion', 5000);

-- Insert Users (password: hashed version of 'password123')
INSERT INTO Users (user_id, full_name, username, email, hashed_password, role) VALUES
('U001', 'John Smith', 'jsmith', 'jsmith@ex.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqw9qiJO', 'Admin'),
('U002', 'Jane Doe', 'jdoe', 'jdoe@ex.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqw9qiJO', 'Manager'),
('U003', 'Grace Gates', 'ggates', 'ggates@ex.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqw9qiJO', 'Staff');

-- Insert Products
INSERT INTO Product (product_id, product_name, description, unit_price, category_id, supplier_id) VALUES
('P001', 'Blue Ballpen', 'Standard blue ink ballpoint pen', 16.00, 'C001', 'S001'),
('P002', 'Black Ballpen', 'Standard black ink ballpoint pen', 10.00, 'C001', 'S001'),
('P003', 'Stapler', 'Heavy-duty office stapler', 40.00, 'C002', 'S001'),
('P004', 'A4 Paper Ream', '500 sheets of A4 white paper', 120.00, 'C001', 'S002');

-- Insert Inventory
INSERT INTO Inventory (inventory_id, product_id, warehouse_id, quantity_on_hand, reorder_level) VALUES
('I001', 'P001', 'W001', 300, 100),
('I002', 'P002', 'W001', 400, 100),
('I003', 'P003', 'W001', 150, 50),
('I004', 'P004', 'W002', 100, 100);

-- Insert Stock_In records
INSERT INTO Stock_In (stock_in_id, product_id, warehouse_id, supplier_id, user_id, quantity, unit_cost, date_received) VALUES
('SI001', 'P001', 'W001', 'S001', 'U001', 100, 15.00, '2026-01-23'),
('SI002', 'P002', 'W001', 'S001', 'U002', 30, 9.00, '2026-01-23'),
('SI003', 'P003', 'W001', 'S001', 'U001', 100, 38.00, '2026-01-25'),
('SI004', 'P001', 'W001', 'S001', 'U002', 100, 15.00, '2026-01-25');

-- Insert Stock_Out records
INSERT INTO Stock_Out (stock_out_id, product_id, warehouse_id, user_id, quantity, date_released, destination) VALUES
('SO001', 'P004', 'W002', 'U003', 200, '2026-03-15', 'Tierra');

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================

-- Made with Bob
