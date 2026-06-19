# Database Import Order - IMPORTANT!

## ⚠️ You MUST import files in this exact order:

### Step 1: Create Database and Import Schema FIRST
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Click "New" in left sidebar
3. Database name: `inventory_system`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"
6. **Select the `inventory_system` database** (click on it in left sidebar)
7. Click "Import" tab
8. Choose file: `schema.sql`
9. Click "Go"
10. Wait for success message

### Step 2: Import Triggers SECOND
1. **Make sure you're still in `inventory_system` database** (check left sidebar)
2. Click "Import" tab
3. Choose file: `triggers.sql`
4. Click "Go"
5. Wait for success message

### Step 3: Import Stored Procedures THIRD
1. **Make sure you're still in `inventory_system` database**
2. Click "Import" tab
3. Choose file: `stored_procedures.sql`
4. Click "Go"
5. Wait for success message

## ✅ Verify Installation

After importing all three files:

1. **Check Tables** (should see 8 tables + 1 audit table):
   - Category
   - Supplier
   - Warehouse
   - Users
   - Product
   - Inventory
   - Stock_In
   - Stock_Out
   - Inventory_Audit

2. **Check Triggers**:
   - Click on any table (e.g., Stock_In)
   - Click "Triggers" tab
   - Should see triggers listed

3. **Check Stored Procedures**:
   - Click "Routines" in top menu
   - Should see 35+ procedures

## 🔴 Common Errors

### Error: "Table doesn't exist"
**Cause**: You're trying to import triggers/procedures before schema
**Solution**: Import schema.sql FIRST

### Error: "Database 'triggers' doesn't exist"
**Cause**: You're in the wrong database or didn't select inventory_system
**Solution**: 
1. Click on `inventory_system` in left sidebar
2. Make sure it's highlighted
3. Then import the file

### Error: "Duplicate table"
**Cause**: You already imported schema.sql
**Solution**: 
1. Drop the database: Click on `inventory_system` → Operations → Drop
2. Start over from Step 1

## 📝 Quick Import Script (Alternative)

If you prefer command line:

```bash
# Make sure MySQL is running in XAMPP
# Open Command Prompt in project folder

mysql -u root -p < database/schema.sql
mysql -u root -p < database/triggers.sql
mysql -u root -p < database/stored_procedures.sql
```

(Press Enter when asked for password - default XAMPP has no password)

## ✨ After Successful Import

You should see:
- 9 tables (8 main + 1 audit)
- 6 triggers
- 35+ stored procedures
- Sample data in all tables

Now you can start the backend server!