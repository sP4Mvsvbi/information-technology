import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='inventory_system'
)

cursor = conn.cursor()
cursor.execute("SHOW PROCEDURE STATUS WHERE Db = 'inventory_system' AND Name LIKE '%supplier%'")
procs = cursor.fetchall()

print("Supplier-related stored procedures:")
if procs:
    for p in procs:
        print(f"  - {p[1]}")
else:
    print("  No supplier procedures found!")

conn.close()

# Made with Bob
