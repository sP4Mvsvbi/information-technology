import mysql.connector
from backend.config import Config

def main():
    conn = mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        autocommit=True
    )
    cursor = conn.cursor()
    
    try:
        # Create a stock in for a completely new warehouse/product combo to trigger ROW_COUNT() = 0
        cursor.execute("INSERT INTO Stock_In (stock_in_id, product_id, warehouse_id, supplier_id, user_id, quantity, unit_cost, date_received) VALUES ('SI999', 'P002', 'W002', 'S001', 'U001', 50, 10.00, '2026-06-20')")
        print("Inserted successfully")
    except Exception as e:
        print("Error:", e)
    finally:
        cursor.execute("DELETE FROM Stock_In WHERE stock_in_id = 'SI999'")
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
