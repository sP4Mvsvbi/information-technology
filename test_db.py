import mysql.connector
from backend.config import Config

def main():
    conn = mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD
    )
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.callproc("sp_get_all_stock_in")
        for result in cursor.stored_results():
            print("Stock In records:", result.fetchall())
            
        cursor.callproc("sp_get_all_stock_out")
        for result in cursor.stored_results():
            print("Stock Out records:", result.fetchall())
            
        print("Success!")
    except Exception as e:
        print("Error:", e)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
