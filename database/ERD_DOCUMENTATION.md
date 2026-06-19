# Entity-Relationship Diagram (ERD) Documentation
## Inventory and Stock Control System
**Team: Mr. Beast**

---

## 1. CONCEPTUAL ERD

### High-Level Entities and Relationships

```
┌─────────────┐
│   Category  │
└──────┬──────┘
       │ 1
       │
       │ M
┌──────▼──────┐      M ┌──────────┐ 1
│   Product   ├────────►│ Supplier │
└──────┬──────┘        └──────────┘
       │ 1
       │
       │ M
┌──────▼──────┐      M ┌───────────┐ 1
│  Inventory  ├────────►│ Warehouse │
└──────┬──────┘        └───────────┘
       │ 1
       ├─────────────┐
       │ M           │ M
┌──────▼──────┐ ┌────▼─────┐
│  Stock_In   │ │Stock_Out │
└──────┬──────┘ └────┬─────┘
       │ M           │ M
       │             │
       │ 1           │ 1
    ┌──▼─────────────▼──┐
    │      Users        │
    └───────────────────┘
```

### Entity Descriptions:

1. **Category** - Logical grouping of products
2. **Supplier** - External vendors providing products
3. **Warehouse** - Physical storage locations
4. **Product** - Items tracked in the system
5. **Inventory** - Current stock levels per product per warehouse
6. **Stock_In** - Incoming stock transactions
7. **Stock_Out** - Outgoing stock transactions
8. **Users** - System users performing transactions

### Relationship Summary:
- One Category has Many Products (1:M)
- One Supplier supplies Many Products (1:M)
- One Product has Many Inventory records (1:M)
- One Warehouse contains Many Inventory records (1:M)
- One Product has Many Stock_In records (1:M)
- One Product has Many Stock_Out records (1:M)
- One Warehouse has Many Stock_In records (1:M)
- One Warehouse has Many Stock_Out records (1:M)
- One Supplier has Many Stock_In records (1:M)
- One User performs Many Stock_In transactions (1:M)
- One User performs Many Stock_Out transactions (1:M)

**All relationships are strictly One-to-Many (1:M)**

---

## 2. LOGICAL ERD

### Entities with Attributes and Data Types

#### **Category**
- **category_id** (VARCHAR(10), PK)
- category_name (VARCHAR(100), NOT NULL, UNIQUE)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### **Supplier**
- **supplier_id** (VARCHAR(10), PK)
- supplier_name (VARCHAR(150), NOT NULL)
- contact_number (VARCHAR(20), NOT NULL)
- email (VARCHAR(100), UNIQUE)
- address (TEXT, NOT NULL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### **Warehouse**
- **warehouse_id** (VARCHAR(10), PK)
- warehouse_name (VARCHAR(100), NOT NULL, UNIQUE)
- location (VARCHAR(200), NOT NULL)
- capacity (INT, DEFAULT 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### **Users**
- **user_id** (VARCHAR(10), PK)
- full_name (VARCHAR(150), NOT NULL)
- username (VARCHAR(50), NOT NULL, UNIQUE)
- email (VARCHAR(100), NOT NULL, UNIQUE)
- hashed_password (VARCHAR(255), NOT NULL)
- role (ENUM: 'Admin', 'Manager')
- is_active (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### **Product**
- **product_id** (VARCHAR(10), PK)
- product_name (VARCHAR(150), NOT NULL)
- description (TEXT)
- unit_price (DECIMAL(10,2), NOT NULL, CHECK >= 0)
- **category_id** (VARCHAR(10), FK → Category)
- **supplier_id** (VARCHAR(10), FK → Supplier)
- is_active (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### **Inventory**
- **inventory_id** (VARCHAR(10), PK)
- **product_id** (VARCHAR(10), FK → Product)
- **warehouse_id** (VARCHAR(10), FK → Warehouse)
- quantity_on_hand (INT, NOT NULL, DEFAULT 0, CHECK >= 0)
- reorder_level (INT, NOT NULL, DEFAULT 0, CHECK >= 0)
- last_updated (TIMESTAMP)
- UNIQUE(product_id, warehouse_id)

#### **Stock_In**
- **stock_in_id** (VARCHAR(10), PK)
- **product_id** (VARCHAR(10), FK → Product)
- **warehouse_id** (VARCHAR(10), FK → Warehouse)
- **supplier_id** (VARCHAR(10), FK → Supplier)
- **user_id** (VARCHAR(10), FK → Users)
- quantity (INT, NOT NULL, CHECK > 0)
- unit_cost (DECIMAL(10,2), CHECK >= 0)
- date_received (DATE, NOT NULL)
- notes (TEXT)
- created_at (TIMESTAMP)

#### **Stock_Out**
- **stock_out_id** (VARCHAR(10), PK)
- **product_id** (VARCHAR(10), FK → Product)
- **warehouse_id** (VARCHAR(10), FK → Warehouse)
- **user_id** (VARCHAR(10), FK → Users)
- quantity (INT, NOT NULL, CHECK > 0)
- date_released (DATE, NOT NULL)
- destination (VARCHAR(200), NOT NULL)
- notes (TEXT)
- created_at (TIMESTAMP)

---

## 3. PHYSICAL ERD

### Implementation Details

#### **Storage Engine:** InnoDB (supports transactions and foreign keys)
#### **Character Set:** utf8mb4_unicode_ci (full Unicode support)

#### **Foreign Key Constraints:**

```sql
Product.category_id → Category.category_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Product.supplier_id → Supplier.supplier_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Inventory.product_id → Product.product_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Inventory.warehouse_id → Warehouse.warehouse_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Stock_In.product_id → Product.product_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Stock_In.warehouse_id → Warehouse.warehouse_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Stock_In.supplier_id → Supplier.supplier_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Stock_In.user_id → Users.user_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Stock_Out.product_id → Product.product_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Stock_Out.warehouse_id → Warehouse.warehouse_id
  ON DELETE RESTRICT ON UPDATE CASCADE

Stock_Out.user_id → Users.user_id
  ON DELETE RESTRICT ON UPDATE CASCADE
```

#### **Indexes for Performance:**

```sql
-- Category
INDEX idx_category_name (category_name)

-- Supplier
INDEX idx_supplier_name (supplier_name)
INDEX idx_supplier_email (email)

-- Warehouse
INDEX idx_warehouse_name (warehouse_name)

-- Users
INDEX idx_username (username)
INDEX idx_email (email)
INDEX idx_role (role)

-- Product
INDEX idx_product_name (product_name)
INDEX idx_category_id (category_id)
INDEX idx_supplier_id (supplier_id)

-- Inventory
INDEX idx_product_id (product_id)
INDEX idx_warehouse_id (warehouse_id)
INDEX idx_low_stock (quantity_on_hand, reorder_level)

-- Stock_In
INDEX idx_product_id (product_id)
INDEX idx_warehouse_id (warehouse_id)
INDEX idx_supplier_id (supplier_id)
INDEX idx_user_id (user_id)
INDEX idx_date_received (date_received)

-- Stock_Out
INDEX idx_product_id (product_id)
INDEX idx_warehouse_id (warehouse_id)
INDEX idx_user_id (user_id)
INDEX idx_date_released (date_released)
```

#### **Database Triggers:**

1. **trg_after_stock_in_insert** - Auto-update inventory on stock in
2. **trg_after_stock_out_insert** - Auto-update inventory on stock out
3. **trg_before_product_insert** - Validate product price
4. **trg_before_product_update** - Validate product price
5. **trg_before_product_delete** - Prevent deletion with inventory
6. **trg_after_inventory_update_audit** - Audit trail for inventory changes

#### **Stored Procedures (35+):**

All CRUD operations implemented as stored procedures with:
- **Transaction Management** (START TRANSACTION, COMMIT, ROLLBACK)
- **Error Handling** (DECLARE EXIT HANDLER)
- **JOIN Operations** for related data display
- **Business Logic Validation**

Categories:
- sp_get_all_categories, sp_get_category_by_id
- sp_create_category, sp_update_category, sp_delete_category

Suppliers:
- sp_get_all_suppliers, sp_get_supplier_by_id
- sp_create_supplier, sp_update_supplier, sp_delete_supplier

Warehouses:
- sp_get_all_warehouses, sp_get_warehouse_by_id
- sp_create_warehouse, sp_update_warehouse, sp_delete_warehouse

Products:
- sp_get_all_products (with JOINs), sp_get_product_by_id (with JOINs)
- sp_create_product, sp_update_product, sp_delete_product

Inventory:
- sp_get_all_inventory (with JOINs)
- sp_get_low_stock_items (with JOINs)
- sp_update_inventory_reorder_level

Stock Transactions:
- sp_get_all_stock_in (with JOINs), sp_create_stock_in
- sp_get_all_stock_out (with JOINs), sp_create_stock_out

Users:
- sp_get_all_users, sp_get_user_by_username
- sp_create_user, sp_update_user

Analytics:
- sp_get_dashboard_metrics
- sp_get_recent_transactions (complex JOINs with UNION)

---

## 4. RELATIONSHIP CARDINALITY

All relationships follow **One-to-Many (1:M)** pattern:

| Parent (1) | Child (M) | Relationship |
|------------|-----------|--------------|
| Category | Product | One category contains many products |
| Supplier | Product | One supplier supplies many products |
| Product | Inventory | One product has many inventory records (different warehouses) |
| Warehouse | Inventory | One warehouse contains many inventory records (different products) |
| Product | Stock_In | One product has many stock-in transactions |
| Warehouse | Stock_In | One warehouse receives many stock-in transactions |
| Supplier | Stock_In | One supplier delivers many stock-in transactions |
| Users | Stock_In | One user records many stock-in transactions |
| Product | Stock_Out | One product has many stock-out transactions |
| Warehouse | Stock_Out | One warehouse releases many stock-out transactions |
| Users | Stock_Out | One user records many stock-out transactions |

---

## 5. BUSINESS RULES ENFORCED

1. **Referential Integrity**: All foreign keys use RESTRICT on delete to prevent orphaned records
2. **Data Validation**: CHECK constraints ensure positive prices and quantities
3. **Uniqueness**: Category names, supplier emails, usernames are unique
4. **Inventory Consistency**: Triggers automatically update inventory on stock movements
5. **Stock Validation**: Cannot release more stock than available
6. **Audit Trail**: All inventory changes are logged
7. **Soft Deletes**: Products can be marked inactive instead of deleted
8. **Timestamps**: Automatic tracking of creation and update times

---

## 6. NORMALIZATION COMPLIANCE

**Target: Third Normal Form (3NF)**

✅ **First Normal Form (1NF)**
- All attributes contain atomic values
- No repeating groups
- Each table has a primary key

✅ **Second Normal Form (2NF)**
- All non-key attributes fully depend on the primary key
- No partial dependencies

✅ **Third Normal Form (3NF)**
- No transitive dependencies
- All non-key attributes depend only on the primary key

**Example of Normalization:**
- Stock transactions were split into Stock_In and Stock_Out because they have different attributes (supplier_id vs destination)
- Inventory was separated from Product to avoid redundancy (one product can be in multiple warehouses)
- Category and Supplier information is not duplicated in Product table (referenced via foreign keys)

---

## 7. SAMPLE QUERIES USING JOINS

```sql
-- Get all products with category and supplier names
CALL sp_get_all_products();

-- Get inventory with product and warehouse details
CALL sp_get_all_inventory();

-- Get recent transactions (Stock In + Stock Out combined)
CALL sp_get_recent_transactions(10);

-- Get low stock items with full details
CALL sp_get_low_stock_items();

-- Get dashboard metrics
CALL sp_get_dashboard_metrics();
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-19  
**Database:** MySQL 8.0+ (XAMPP)