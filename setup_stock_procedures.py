import mysql.connector
from backend.config import Config

sql_statements = """
DELIMITER //

CREATE PROCEDURE sp_get_all_stock_in()
BEGIN
    SELECT stock_in_id, product_id, warehouse_id, supplier_id, user_id, quantity, unit_cost, date_received, notes, created_at
    FROM Stock_In
    ORDER BY date_received DESC, created_at DESC;
END //

CREATE PROCEDURE sp_create_stock_in(
    IN p_stock_in_id VARCHAR(10),
    IN p_product_id VARCHAR(10),
    IN p_warehouse_id VARCHAR(10),
    IN p_supplier_id VARCHAR(10),
    IN p_user_id VARCHAR(10),
    IN p_quantity INT,
    IN p_unit_cost DECIMAL(10, 2),
    IN p_date_received DATE,
    IN p_notes TEXT
)
BEGIN
    INSERT INTO Stock_In (stock_in_id, product_id, warehouse_id, supplier_id, user_id, quantity, unit_cost, date_received, notes)
    VALUES (p_stock_in_id, p_product_id, p_warehouse_id, p_supplier_id, p_user_id, p_quantity, p_unit_cost, p_date_received, p_notes);
END //

CREATE PROCEDURE sp_get_all_stock_out()
BEGIN
    SELECT stock_out_id, product_id, warehouse_id, user_id, quantity, date_released, destination, notes, created_at
    FROM Stock_Out
    ORDER BY date_released DESC, created_at DESC;
END //

CREATE PROCEDURE sp_create_stock_out(
    IN p_stock_out_id VARCHAR(10),
    IN p_product_id VARCHAR(10),
    IN p_warehouse_id VARCHAR(10),
    IN p_user_id VARCHAR(10),
    IN p_quantity INT,
    IN p_date_released DATE,
    IN p_destination VARCHAR(200),
    IN p_notes TEXT
)
BEGIN
    INSERT INTO Stock_Out (stock_out_id, product_id, warehouse_id, user_id, quantity, date_released, destination, notes)
    VALUES (p_stock_out_id, p_product_id, p_warehouse_id, p_user_id, p_quantity, p_date_released, p_destination, p_notes);
END //
"""

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
    
    # We will split by END // instead of trying to execute the whole DELIMITER block at once with mysql.connector.
    
    procs = [
        """
        CREATE PROCEDURE sp_get_all_stock_in()
        BEGIN
            SELECT stock_in_id, product_id, warehouse_id, supplier_id, user_id, quantity, unit_cost, date_received, notes, created_at
            FROM Stock_In
            ORDER BY date_received DESC, created_at DESC;
        END
        """,
        """
        CREATE PROCEDURE sp_create_stock_in(
            IN p_stock_in_id VARCHAR(10),
            IN p_product_id VARCHAR(10),
            IN p_warehouse_id VARCHAR(10),
            IN p_supplier_id VARCHAR(10),
            IN p_user_id VARCHAR(10),
            IN p_quantity INT,
            IN p_unit_cost DECIMAL(10, 2),
            IN p_date_received DATE,
            IN p_notes TEXT
        )
        BEGIN
            INSERT INTO Stock_In (stock_in_id, product_id, warehouse_id, supplier_id, user_id, quantity, unit_cost, date_received, notes)
            VALUES (p_stock_in_id, p_product_id, p_warehouse_id, p_supplier_id, p_user_id, p_quantity, p_unit_cost, p_date_received, p_notes);
        END
        """,
        """
        CREATE PROCEDURE sp_get_all_stock_out()
        BEGIN
            SELECT stock_out_id, product_id, warehouse_id, user_id, quantity, date_released, destination, notes, created_at
            FROM Stock_Out
            ORDER BY date_released DESC, created_at DESC;
        END
        """,
        """
        CREATE PROCEDURE sp_create_stock_out(
            IN p_stock_out_id VARCHAR(10),
            IN p_product_id VARCHAR(10),
            IN p_warehouse_id VARCHAR(10),
            IN p_user_id VARCHAR(10),
            IN p_quantity INT,
            IN p_date_released DATE,
            IN p_destination VARCHAR(200),
            IN p_notes TEXT
        )
        BEGIN
            INSERT INTO Stock_Out (stock_out_id, product_id, warehouse_id, user_id, quantity, date_released, destination, notes)
            VALUES (p_stock_out_id, p_product_id, p_warehouse_id, p_user_id, p_quantity, p_date_released, p_destination, p_notes);
        END
        """
    ]
    
    try:
        cursor.execute("DROP PROCEDURE IF EXISTS sp_get_all_stock_in")
        cursor.execute("DROP PROCEDURE IF EXISTS sp_create_stock_in")
        cursor.execute("DROP PROCEDURE IF EXISTS sp_get_all_stock_out")
        cursor.execute("DROP PROCEDURE IF EXISTS sp_create_stock_out")
        
        for p in procs:
            cursor.execute(p)
            print("Executed procedure successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
