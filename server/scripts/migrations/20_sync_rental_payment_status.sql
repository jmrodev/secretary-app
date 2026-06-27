-- =============================================================================
-- Migration 20: Sync rental payment status and trigger automation
-- Creado: 2026-06-26
-- =============================================================================

-- 1. Add rental_id column and foreign key to transactions table
ALTER TABLE transactions ADD COLUMN rental_id INT NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transaction_rental FOREIGN KEY (rental_id) REFERENCES office_rentals(id) ON DELETE CASCADE;

DELIMITER //

-- ---------------------------------------------------------------------------
-- 2. sp_sync_rental_payment_status
--    Calculates and updates is_paid for an office rental based on transactions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_sync_rental_payment_status(
    IN p_rental_id INT
)
BEGIN
    DECLARE v_cost           DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paid_amount    DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_rows     INT DEFAULT 0;
    DECLARE v_is_paid        TINYINT DEFAULT 0;

    -- Get rental cost
    SELECT COALESCE(cost, 0) INTO v_cost
    FROM office_rentals
    WHERE id = p_rental_id;

    -- Get paid transaction summaries for this rental
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)
    INTO v_total_rows, v_paid_amount
    FROM transactions
    WHERE rental_id = p_rental_id;

    -- Determine is_paid status
    IF v_total_rows > 0 AND v_paid_amount >= v_cost THEN
        SET v_is_paid = 1;
    ELSE
        SET v_is_paid = 0;
    END IF;

    UPDATE office_rentals
    SET is_paid = v_is_paid
    WHERE id = p_rental_id;
END //

-- ---------------------------------------------------------------------------
-- 3. sp_create_transaction
--    Redefine sp_create_transaction to support p_rental_id parameter.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_create_transaction(
    IN  p_type             VARCHAR(50),
    IN  p_amount           DECIMAL(10,2),
    IN  p_method           VARCHAR(50),
    IN  p_description      VARCHAR(255),
    IN  p_doctor_id        INT,
    IN  p_status           VARCHAR(50),
    IN  p_is_withdrawal    TINYINT(1),
    IN  p_related_user_id  INT,
    IN  p_transaction_date TIMESTAMP,
    IN  p_appointment_id   INT,
    IN  p_request_id       INT,
    IN  p_rental_id        INT,
    IN  p_idempotency_key  VARCHAR(100),
    OUT p_id               INT
)
BEGIN
    INSERT INTO transactions (
        type,
        amount,
        method,
        description,
        doctor_id,
        status,
        is_withdrawal,
        related_user_id,
        transaction_date,
        appointment_id,
        request_id,
        rental_id
    ) VALUES (
        p_type,
        p_amount,
        COALESCE(p_method,  'cash'),
        p_description,
        p_doctor_id,
        COALESCE(p_status,  'paid'),
        COALESCE(p_is_withdrawal, 0),
        p_related_user_id,
        COALESCE(p_transaction_date, NOW()),
        p_appointment_id,
        p_request_id,
        p_rental_id
    );

    SET p_id = LAST_INSERT_ID();
END //

-- ---------------------------------------------------------------------------
-- 4. proc_pay_doctor_debt
--    FIFO debt payment for doctors' office rental debts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE proc_pay_doctor_debt(
    IN p_doctor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_method VARCHAR(50),
    IN p_description_prefix VARCHAR(255),
    IN p_idempotency_key VARCHAR(100)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_remaining DECIMAL(10,2) DEFAULT p_amount;
    DECLARE v_user_id INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_debt_id INT;
    DECLARE v_debt_amount DECIMAL(10,2);
    DECLARE v_debt_desc VARCHAR(255);
    DECLARE v_rental_id INT;

    -- Cursor to iterate through pending debts (oldest first)
    DECLARE cur_debts CURSOR FOR 
        SELECT t.id, t.amount, t.description, t.rental_id
        FROM transactions t
        JOIN doctors d ON t.related_user_id = d.user_id
        WHERE d.id = p_doctor_id AND t.status = 'pending'
        ORDER BY t.transaction_date ASC, t.id ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    -- Get User ID
    SELECT user_id INTO v_user_id FROM doctors WHERE id = p_doctor_id;
    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Doctor not found';
    END IF;

    OPEN cur_debts;

    read_loop: LOOP
        FETCH cur_debts INTO v_debt_id, v_debt_amount, v_debt_desc, v_rental_id;
        IF done OR v_remaining <= 0.01 THEN
            LEAVE read_loop;
        END IF;

        IF v_remaining >= v_debt_amount THEN
            -- Full payment of this debt
            UPDATE transactions SET 
                status = 'paid', 
                method = p_method, 
                description = CONCAT(p_description_prefix, ': ', v_debt_desc, ' - FULL PAID')
            WHERE id = v_debt_id;
            
            SET v_remaining = v_remaining - v_debt_amount;
        ELSE
            -- Partial payment
            UPDATE transactions SET 
                status = 'paid', 
                amount = v_remaining, 
                method = p_method, 
                description = CONCAT(p_description_prefix, ': ', v_debt_desc, ' - PARTIAL PAID')
            WHERE id = v_debt_id;

            INSERT INTO transactions (
                type, amount, description, related_user_id, doctor_id, 
                method, status, rental_id, transaction_date
            ) VALUES (
                'income_rental', v_debt_amount - v_remaining, v_debt_desc, v_user_id, p_doctor_id,
                'on_account', 'pending', v_rental_id, NOW()
            );

            SET v_remaining = 0;
        END IF;

        -- Sync status on the fly
        IF v_rental_id IS NOT NULL THEN
            CALL sp_sync_rental_payment_status(v_rental_id);
        END IF;
    END LOOP;

    CLOSE cur_debts;

    -- Handle Advance Payment (if money still remains)
    IF v_remaining > 0.01 THEN
        INSERT INTO transactions (
            type, amount, description, related_user_id, doctor_id, 
            method, status, transaction_date
        ) VALUES (
            'income_rental', v_remaining, 'Advance Rental Payment / Credit Balance', v_user_id, p_doctor_id,
            p_method, 'paid', NOW()
        );
    END IF;

    COMMIT;
END //

-- ---------------------------------------------------------------------------
-- 5. trg_office_rental_insert
--    Trigger to automatically create pending transaction when rental is booked.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_office_rental_insert
AFTER INSERT ON office_rentals
FOR EACH ROW
BEGIN
    INSERT INTO transactions (
        type,
        amount,
        description,
        doctor_id,
        status,
        method,
        is_withdrawal,
        related_user_id,
        transaction_date,
        rental_id
    ) VALUES (
        'income_rental',
        NEW.cost,
        CONCAT('Alquiler de Consultorio (Reserva): ', NEW.rental_date),
        NEW.doctor_id,
        CASE WHEN NEW.cost = 0 THEN 'paid' ELSE 'pending' END,
        CASE WHEN NEW.cost = 0 THEN 'bonified' ELSE 'on_account' END,
        0,
        (SELECT user_id FROM doctors WHERE id = NEW.doctor_id),
        NOW(),
        NEW.id
    );
END //

DELIMITER ;
