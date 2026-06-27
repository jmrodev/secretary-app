-- =============================================================================
-- Migration 19: Synchronization of appointment payment status and fixes
-- Creado: 2026-06-26
-- =============================================================================

DELIMITER //

-- ---------------------------------------------------------------------------
-- 1. sp_sync_appointment_payment_status
--    Calculates and updates payment_status and is_paid for an appointment
--    based on related transactions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_sync_appointment_payment_status(
    IN p_appointment_id INT
)
BEGIN
    DECLARE v_cost           DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paid_amount    DECIMAL(10,2) DEFAULT 0;
    DECLARE v_pending_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_bonified_count INT DEFAULT 0;
    DECLARE v_total_rows     INT DEFAULT 0;
    DECLARE v_new_status     VARCHAR(50);
    DECLARE v_is_paid        TINYINT DEFAULT 0;

    -- Get appointment cost
    SELECT COALESCE(cost, 0) INTO v_cost
    FROM appointments
    WHERE id = p_appointment_id;

    -- Get transaction summaries
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN method = 'bonified' OR amount = 0 THEN 1 ELSE 0 END), 0)
    INTO v_total_rows, v_paid_amount, v_pending_amount, v_bonified_count
    FROM transactions
    WHERE appointment_id = p_appointment_id;

    -- Determine new status and is_paid
    IF v_total_rows = 0 THEN
        SET v_new_status = 'pending';
        SET v_is_paid = 0;
    ELSEIF v_bonified_count = v_total_rows THEN
        SET v_new_status = 'paid';
        SET v_is_paid = 1;
    -- If total paid is greater than or equal to cost, it is fully paid
    ELSEIF v_paid_amount >= v_cost THEN
        SET v_new_status = 'paid';
        SET v_is_paid = 1;
    ELSEIF v_paid_amount > 0 THEN
        SET v_new_status = 'partial';
        SET v_is_paid = 0;
    ELSEIF v_pending_amount > 0 THEN
        SET v_new_status = 'debt';
        SET v_is_paid = 0;
    ELSE
        SET v_new_status = 'pending';
        SET v_is_paid = 0;
    END IF;

    UPDATE appointments
    SET
        payment_status = v_new_status,
        is_paid        = v_is_paid
    WHERE id = p_appointment_id;
END //

-- ---------------------------------------------------------------------------
-- 2. sp_book_appointment
--    Updates sp_book_appointment to synchronize payment status at completion.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_book_appointment(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_appointment_date DATETIME,
    IN p_reason VARCHAR(255),
    IN p_is_out_of_hours TINYINT,
    IN p_type ENUM('consultation', 'virtual'),
    IN p_institution_id INT,
    IN p_bonified TINYINT,
    IN p_created_by INT,
    OUT p_appointment_id INT
)
BEGIN
    DECLARE v_existing_active INT DEFAULT 0;
    
    -- Check for blocking appointments (excluding cancelled/absent/suspended)
    SELECT COUNT(*) INTO v_existing_active
    FROM appointments
    WHERE doctor_id = p_doctor_id 
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled', 'absent', 'suspended', 'reserved');
    
    IF v_existing_active > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'slot_already_taken';
    END IF;

    -- Create the appointment
    INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, reason, 
        is_out_of_hours, type, status, institution_id, bonified, created_at
    ) VALUES (
        p_patient_id, p_doctor_id, p_appointment_date, p_reason, 
        p_is_out_of_hours, p_type, 'pending', p_institution_id, p_bonified, NOW()
    );
    
    SET p_appointment_id = LAST_INSERT_ID();

    -- Automatic Transaction Generation
    IF p_bonified = 1 THEN
        INSERT INTO transactions (
            type, amount, description, related_user_id, doctor_id, 
            institution_id, method, status, appointment_id, transaction_date
        ) VALUES (
            'income', 0, CONCAT(p_reason, ' (Bonificado)'), 
            (SELECT user_id FROM patients WHERE id = p_patient_id),
            p_doctor_id, p_institution_id, 'bonified', 'paid', p_appointment_id, p_appointment_date
        );
    ELSE
        BEGIN
            DECLARE v_patient_price DECIMAL(15,2);
            DECLARE v_base_price DECIMAL(15,2);
            DECLARE v_inst_share DECIMAL(15,2) DEFAULT 0;
            DECLARE v_pat_user_id INT;
            
            SELECT user_id INTO v_pat_user_id FROM patients WHERE id = p_patient_id;
            
            -- Calculate service price
            SET v_patient_price = fn_calculate_service_price(p_doctor_id, p_patient_id, 'consultation', p_institution_id);
            
            -- Calculate institution share
            IF p_institution_id IS NOT NULL THEN
                SELECT COALESCE(base_price, 0) INTO v_base_price FROM institutions WHERE id = p_institution_id;
                IF v_base_price > v_patient_price THEN
                    SET v_inst_share = v_base_price - v_patient_price;
                END IF;
            END IF;

            -- Patient Transaction (Debt/Pending initially)
            INSERT INTO transactions (
                type, amount, description, related_user_id, doctor_id, 
                institution_id, method, status, appointment_id, transaction_date
            ) VALUES (
                'income', v_patient_price, p_reason, v_pat_user_id,
                p_doctor_id, p_institution_id, 'on_account', 'pending', p_appointment_id, p_appointment_date
            );
            
            -- Institution Transaction
            IF v_inst_share > 0 THEN
                INSERT INTO transactions (
                    type, amount, description, related_user_id, doctor_id, 
                    institution_id, method, status, appointment_id, transaction_date
                ) VALUES (
                    'income', v_inst_share, CONCAT(p_reason, ' (Inst. Share)'), v_pat_user_id,
                    p_doctor_id, p_institution_id, 'on_account', 'pending', p_appointment_id, p_appointment_date
                );
            END IF;
        END;
    END IF;

    -- Sync appointment payment status
    CALL sp_sync_appointment_payment_status(p_appointment_id);
END //

-- ---------------------------------------------------------------------------
-- 3. proc_pay_patient_debt
--    Updates procedure to support 6 parameters (with idempotency key)
--    and correctly trigger status synchronizations.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE proc_pay_patient_debt(
    IN p_patient_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_method VARCHAR(50),
    IN p_doctor_id INT,
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
    DECLARE v_appt_id INT;
    DECLARE v_req_id INT;

    -- Cursor to iterate through pending debts (oldest first)
    DECLARE cur_debts CURSOR FOR 
        SELECT t.id, t.amount, t.description, t.appointment_id, t.request_id
        FROM transactions t
        JOIN patients p ON t.related_user_id = p.user_id
        WHERE p.id = p_patient_id AND t.status = 'pending'
        ORDER BY t.transaction_date ASC, t.id ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    -- Get User ID
    SELECT user_id INTO v_user_id FROM patients WHERE id = p_patient_id;
    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Patient not found';
    END IF;

    OPEN cur_debts;

    read_loop: LOOP
        FETCH cur_debts INTO v_debt_id, v_debt_amount, v_debt_desc, v_appt_id, v_req_id;
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
                method, status, appointment_id, request_id, transaction_date
            ) VALUES (
                'income_patient', v_debt_amount - v_remaining, v_debt_desc, v_user_id, p_doctor_id,
                'on_account', 'pending', v_appt_id, v_req_id, NOW()
            );

            SET v_remaining = 0;
        END IF;

        -- Sync status on the fly for each processed debt
        IF v_appt_id IS NOT NULL THEN
            CALL sp_sync_appointment_payment_status(v_appt_id);
        END IF;
        IF v_req_id IS NOT NULL THEN
            CALL sp_sync_request_payment_status(v_req_id);
        END IF;
    END LOOP;

    CLOSE cur_debts;

    -- Handle Advance Payment (if money still remains)
    IF v_remaining > 0.01 THEN
        INSERT INTO transactions (
            type, amount, description, related_user_id, doctor_id, 
            method, status, transaction_date
        ) VALUES (
            'income_patient', v_remaining, 'Advance Payment / Credit Balance', v_user_id, p_doctor_id,
            p_method, 'paid', NOW()
        );
    END IF;

    COMMIT;
END //

DELIMITER ;
