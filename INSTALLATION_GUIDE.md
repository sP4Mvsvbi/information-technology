# Installation and Setup Guide
## Inventory and Stock Control System
**Team: Mr. Beast**

---

## Prerequisites

### Required Software:
1. **XAMPP** (for MySQL database)
   - Download: https://www.apachefriends.org/
   - Version: 8.0 or higher

2. **Python** 
   - Version: 3.8 or higher
   - Download: https://www.python.org/downloads/

3. **Modern Web Browser**
   - Chrome, Firefox, Safari, or Edge (latest version)

---

## Step 1: Install XAMPP and Setup MySQL

1. **Install XAMPP**
   - Download and install XAMPP from the official website
   - Install to default location (C:\xampp on Windows)

2. **Start MySQL Service**
   - Open XAMPP Control Panel
   - Click "Start" button next to MySQL
   - MySQL should show a green background when running

3. **Access phpMyAdmin**
   - Open browser and go to: `http://localhost/phpmyadmin`
   - Default username: `root`
   - Default password: (leave empty)

---

## Step 2: Create Database and Import Schema

### Option A: Using phpMyAdmin (Recommended)

1. **Create Database**
   - In phpMyAdmin, click "New" in the left sidebar
   - Database name: `inventory_system`
   - Collation: `utf8mb4_unicode_ci`
   - Click "Create"

2. **Import Schema**
   - Select `inventory_system` database from left sidebar
   - Click "Import" tab at the top
   - Click "Choose File" and select `database/schema.sql`
   - Click "Go" at the bottom
   - Wait for success message

3. **Import Triggers**
   - Still in Import tab
   - Choose file: `database/triggers.sql`
   - Click "Go"

4. **Import Stored Procedures**
   - Still in Import tab
   - Choose file: `database/stored_procedures.sql`
   - Click "Go"

### Option B: Using MySQL Command Line

```bash
# Navigate to project directory
cd c:/Users/renzo/information-technology

# Import schema
mysql -u root -p < database/schema.sql

# Import triggers
mysql -u root -p < database/triggers.sql

# Import stored procedures
mysql -u root -p < database/stored_procedures.sql
```

---

## Step 3: Setup Python Backend

1. **Open Command Prompt/Terminal**
   ```bash
   cd c:/Users/renzo/information-technology
   ```

2. **Create Virtual Environment (Recommended)**
   ```bash
   python -m venv venv
   ```

3. **Activate Virtual Environment**
   
   **Windows:**
   ```bash
   venv\Scripts\activate
   ```
   
   **Mac/Linux:**
   ```bash
   source venv/bin/activate
   ```

4. **Install Dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

5. **Verify Installation**
   ```bash
   pip list
   ```
   
   You should see:
   - Flask
   - flask-cors
   - mysql-connector-python
   - PyJWT
   - bcrypt

---

## Step 4: Configure Database Connection

1. **Open `backend/app.py`**

2. **Verify Database Configuration** (lines 24-30):
   ```python
   DB_CONFIG = {
       'host': 'localhost',
       'user': 'root',
       'password': '',  # Default XAMPP password is empty
       'database': 'inventory_system',
       'port': 3306
   }
   ```

3. **If you changed MySQL password**, update the `password` field

---

## Step 5: Start the Backend Server

1. **Make sure XAMPP MySQL is running**

2. **Start Flask Backend**
   ```bash
   cd backend
   python app.py
   ```

3. **Verify Backend is Running**
   - You should see:
     ```
     ============================================================
     Inventory & Stock Control System - Backend API
     ============================================================
     Database: MySQL (XAMPP)
     All operations use Stored Procedures
     Server running on: http://localhost:5000
     ============================================================
     ```

4. **Test Health Check**
   - Open browser: `http://localhost:5000/api/health`
   - Should return: `{"status": "healthy", "database": "connected"}`

---

## Step 6: Start the Frontend Server

1. **Open NEW Command Prompt/Terminal**
   ```bash
   cd c:/Users/renzo/information-technology
   ```

2. **Start Python HTTP Server**
   ```bash
   python main.py
   ```
   
   Or use custom port:
   ```bash
   python main.py 8000
   ```

3. **Verify Frontend is Running**
   - You should see:
     ```
     Inventory & Stock Control System
     ==================================
     Server running at: http://localhost:3000
     Open in browser:   http://localhost:3000/login.html
     ```

---

## Step 7: Access the Application

1. **Open Web Browser**
   - Navigate to: `http://localhost:3000/login.html`

2. **Login with Default Credentials**
   
   | Username | Password | Role    |
   |----------|----------|---------|
   | jsmith   | smith123 | Admin   |
   | jdoe     | doe123   | Manager |


3. **Explore the System**
   - Dashboard
   - Products Management
   - Categories Management
   - Suppliers Management
   - Warehouses Management
   - Inventory Tracking
   - Stock In/Out Transactions
   - User Management

---

## Troubleshooting

### Problem: MySQL won't start in XAMPP
**Solution:**
- Check if port 3306 is already in use
- Stop other MySQL services
- Change MySQL port in XAMPP config

### Problem: Backend can't connect to database
**Solution:**
- Verify XAMPP MySQL is running
- Check database name is `inventory_system`
- Verify credentials in `backend/app.py`
- Test connection in phpMyAdmin

### Problem: "Module not found" error
**Solution:**
```bash
pip install -r backend/requirements.txt
```

### Problem: CORS errors in browser
**Solution:**
- Make sure backend is running on port 5000
- Check flask-cors is installed
- Clear browser cache

### Problem: Stored procedures not found
**Solution:**
- Re-import `database/stored_procedures.sql`
- Check in phpMyAdmin under "Routines" tab

---

## Verification Checklist

- [ ] XAMPP installed and MySQL running
- [ ] Database `inventory_system` created
- [ ] Schema imported (8 tables visible in phpMyAdmin)
- [ ] Triggers imported (6 triggers visible)
- [ ] Stored procedures imported (35+ procedures visible)
- [ ] Python dependencies installed
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Can login to the application
- [ ] Can view dashboard
- [ ] Can perform CRUD operations

---

## Project Structure

```
information-technology/
├── database/
│   ├── schema.sql                 # Database schema (8 tables)
│   ├── triggers.sql               # Database triggers (6 triggers)
│   ├── stored_procedures.sql      # All stored procedures (35+)
│   └── ERD_DOCUMENTATION.md       # ERD and normalization docs
├── backend/
│   ├── app.py                     # Flask API (all endpoints)
│   └── requirements.txt           # Python dependencies
├── js/
│   ├── components/                # Reusable UI components
│   ├── data/
│   │   └── mockData.js           # Will be replaced with API calls
│   ├── pages/                     # Page-specific logic
│   └── utils/                     # Utility functions
├── css/                           # Stylesheets
├── *.html                         # HTML pages
├── main.py                        # Frontend dev server
└── INSTALLATION_GUIDE.md          # This file
```

---

## Next Steps

After successful installation:

1. **Test All Features**
   - Create, read, update, delete operations
   - Stock in/out transactions
   - Inventory tracking
   - Low stock alerts

2. **Review Database**
   - Check triggers are working (inventory auto-updates)
   - Verify transactions are atomic
   - Review audit trail in `Inventory_Audit` table

3. **Customize**
   - Add more products and categories
   - Configure reorder levels
   - Add more users

4. **Production Deployment** (Future)
   - Change database password
   - Update SECRET_KEY in app.py
   - Use production WSGI server (Gunicorn)
   - Enable HTTPS
   - Implement proper password hashing with bcrypt

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review database logs in XAMPP
- Check browser console for frontend errors
- Check terminal for backend errors

---

**Installation Complete! 🎉**

Your Inventory and Stock Control System is now ready to use.