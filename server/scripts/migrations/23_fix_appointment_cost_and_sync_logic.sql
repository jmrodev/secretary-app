-- =============================================================================
-- Migration 23: Fix appointment cost population and sync logic for zero cost
-- Creado: 2026-06-26
-- =============================================================================

DELIMITER //

-- 1. Update sp_sync_appointment_payment_status to protect against 0.00 cost with pending transactions
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
    -- If there is a pending amount, it cannot be fully paid (regardless of cost column value)
    ELSEIF v_pending_amount > 0 THEN
        IF v_paid_amount > 0 THEN
            SET v_new_status = 'partial';
        ELSE
            SET v_new_status = 'debt';
        END IF;
        SET v_is_paid = 0;
    -- If total paid is greater than or equal to cost, it is fully paid
    ELSEIF v_paid_amount >= v_cost THEN
        SET v_new_status = 'paid';
        SET v_is_paid = 1;
    ELSEIF v_paid_amount > 0 THEN
        SET v_new_status = 'partial';
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

-- 2. Update sp_book_appointment to populate appointment cost on creation
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
        is_out_of_hours, type, status, institution_id, bonified
    ) VALUES (
        p_patient_id, p_doctor_id, p_appointment_date, p_reason, 
        p_is_out_of_hours, p_type, 'pending', p_institution_id, p_bonified
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
        
        UPDATE appointments SET cost = 0.00 WHERE id = p_appointment_id;
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

            -- Update appointment cost
            UPDATE appointments SET cost = v_patient_price + v_inst_share WHERE id = p_appointment_id;
        END;
    END IF;

    -- Sync appointment payment status
    CALL sp_sync_appointment_payment_status(p_appointment_id);
END //

DELIMITER ;
