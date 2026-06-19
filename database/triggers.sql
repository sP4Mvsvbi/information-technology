-- ============================================================================
-- INVENTORY AND STOCK CONTROL SYSTEM - DATABASE TRIGGERS
-- Team: Mr. Beast
-- Database: MySQL (XAMPP)
-- Purpose: Automate inventory updates and enforce business rules
-- ============================================================================

USE inventory_system;

-- ============================================================================
-- TRIGGER 1: Update Inventory After Stock In
-- Purpose: Automatically increase inventory quantity when stock is received
-- Type: AFTER INSERT on Stock_In
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_after_stock_in_insert
AFTER INSERT ON Stock_In
FOR EACH ROW
BEGIN
    -- Update inventory quantity
    UPDATE Inventory
    SET quantity_on_hand = quantity_on_hand + NEW.quantity,
        last_updated = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id 
      AND warehouse_id = NEW.warehouse_id;
    
    -- If inventory record doesn't exist, create it
    IF ROW_COUNT() = 0 THEN
        INSERT INTO Inventory (
            inventory_id,
            product_id,
            warehouse_id,
            quantity_on_hand,
            reorder_level
        ) VALUES (
            CONCAT('I', LPAD((SELECT COUNT(*) + 1 FROM Inventory), 3, '0')),
            NEW.product_id,
            NEW.warehouse_id,
            NEW.quantity,
            50
        );
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGER 2: Update Inventory After Stock Out
-- Purpose: Automatically decrease inventory quantity when stock is released
-- Type: AFTER INSERT on Stock_Out
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_after_stock_out_insert
AFTER INSERT ON Stock_Out
FOR EACH ROW
BEGIN
    DECLARE current_quantity INT;
    
    SELECT quantity_on_hand INTO current_quantity
    FROM Inventory
    WHERE product_id = NEW.product_id 
      AND warehouse_id = NEW.warehouse_id;
    
    IF current_quantity IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Inventory record not found';
    END IF;
    
    IF current_quantity < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock';
    END IF;
    
    UPDATE Inventory
    SET quantity_on_hand = quantity_on_hand - NEW.quantity,
        last_updated = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id 
      AND warehouse_id = NEW.warehouse_id;
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGER 3: Validate Product Price
-- Type: BEFORE INSERT/UPDATE on Product
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_before_product_insert
BEFORE INSERT ON Product
FOR EACH ROW
BEGIN
    IF NEW.unit_price < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Product price must be non-negative';
    END IF;
END$$

CREATE TRIGGER trg_before_product_update
BEFORE UPDATE ON Product
FOR EACH ROW
BEGIN
    IF NEW.unit_price < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Product price must be non-negative';
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGER 4: Prevent Deletion of Products with Inventory
-- Type: BEFORE DELETE on Product
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_before_product_delete
BEFORE DELETE ON Product
FOR EACH ROW
BEGIN
    DECLARE total_stock INT;
    
    SELECT SUM(quantity_on_hand) INTO total_stock
    FROM Inventory
    WHERE product_id = OLD.product_id;
    
    IF total_stock > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete product with existing inventory';
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGER 5: Audit Trail for Inventory Changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS Inventory_Audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id VARCHAR(10) NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    warehouse_id VARCHAR(10) NOT NULL,
    old_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    quantity_change INT NOT NULL,
    change_type ENUM('INCREASE', 'DECREASE') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inventory_id (inventory_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER trg_after_inventory_update_audit
AFTER UPDATE ON Inventory
FOR EACH ROW
BEGIN
    DECLARE change_amount INT;
    DECLARE change_direction ENUM('INCREASE', 'DECREASE');
    
    SET change_amount = NEW.quantity_on_hand - OLD.quantity_on_hand;
    
    IF change_amount > 0 THEN
        SET change_direction = 'INCREASE';
    ELSE
        SET change_direction = 'DECREASE';
    END IF;
    
    INSERT INTO Inventory_Audit (
        inventory_id,
        product_id,
        warehouse_id,
        old_quantity,
        new_quantity,
        quantity_change,
        change_type
    ) VALUES (
        NEW.inventory_id,
        NEW.product_id,
        NEW.warehouse_id,
        OLD.quantity_on_hand,
        NEW.quantity_on_hand,
        ABS(change_amount),
        change_direction
    );
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGERS COMPLETE - Total: 6 triggers + 1 audit table
-- ============================================================================

-- Made with Bob
