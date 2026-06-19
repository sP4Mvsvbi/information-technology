# 🚀 How to Start the Inventory System

## Step 1: Start the Backend API (Flask)

Open Terminal 1 in VS Code and run:
```bash
python backend/app.py
```

This will start the Flask API on **http://127.0.0.1:5000**

Keep this terminal running!

## Step 2: Start the Frontend Server

Open a NEW terminal (Terminal 2) and run:
```bash
python -m http.server 3000
```

This will start a web server on **http://localhost:3000**

## Step 3: Open the Website

Open your browser and go to:
```
http://localhost:3000/login.html
```

## Step 4: Login

Use these credentials:
- **Username:** `jsmith`
- **Password:** `admin123`

## ✅ You're Ready!

After logging in, you can:
- View and manage suppliers
- Add/edit/delete suppliers (saved to MySQL database)
- Changes persist after page refresh

---

## 🔧 Troubleshooting

**If you see module errors:**
- Make sure you're using `http://localhost:3000/login.html` NOT `file:///...`
- ES6 modules require a web server

**If API calls fail:**
- Check that Flask is running on port 5000 (Terminal 1)
- Check that MySQL (XAMPP) is running

**If login fails:**
- Username: `jsmith`
- Password: `admin123`
- Check browser console for errors (F12)

---

Made with Bob