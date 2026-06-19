import mysql.connector
from backend.config import Config

sql = """
DROP TRIGGER IF EXISTS trg_after_stock_in_insert;

CREATE TRIGGER trg_after_stock_in_insert
AFTER INSERT ON Stock_In
FOR EACH ROW
BEGIN
    DECLARE next_id INT;

    -- Update inventory quantity
    UPDATE Inventory
    SET quantity_on_hand = quantity_on_hand + NEW.quantity,
        last_updated = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id 
      AND warehouse_id = NEW.warehouse_id;
    
    -- If inventory record doesn't exist, create it
    IF ROW_COUNT() = 0 THEN
        -- Workaround for MySQL Error 1093
        SELECT COUNT(*) + 1 INTO next_id FROM (SELECT * FROM Inventory) AS tmp;

        INSERT INTO Inventory (
            inventory_id,
            product_id,
            warehouse_id,
            quantity_on_hand,
            reorder_level
        ) VALUES (
            CONCAT('I', LPAD(next_id, 3, '0')),
            NEW.product_id,
            NEW.warehouse_id,
            NEW.quantity,
            50
        );
    END IF;
END;
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
    
    try:
        cursor.execute("DROP TRIGGER IF EXISTS trg_after_stock_in_insert")
        cursor.execute("""
CREATE TRIGGER trg_after_stock_in_insert
AFTER INSERT ON Stock_In
FOR EACH ROW
BEGIN
    DECLARE next_id INT;

    UPDATE Inventory
    SET quantity_on_hand = quantity_on_hand + NEW.quantity,
        last_updated = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id 
      AND warehouse_id = NEW.warehouse_id;
    
    IF ROW_COUNT() = 0 THEN
        SELECT COUNT(*) + 1 INTO next_id FROM (SELECT * FROM Inventory) AS tmp;

        INSERT INTO Inventory (
            inventory_id,
            product_id,
            warehouse_id,
            quantity_on_hand,
            reorder_level
        ) VALUES (
            CONCAT('I', LPAD(next_id, 3, '0')),
            NEW.product_id,
            NEW.warehouse_id,
            NEW.quantity,
            50
        );
    END IF;
END;
        """)
        print("Trigger recreated successfully.")
    except Exception as e:
        print("Error recreating trigger:", e)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
