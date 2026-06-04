-- Optimization Migration: Atomic FIFO Debt Payment Procedure
-- Priority: Database Level (Architecture Rule 15.3)
-- This procedure handles the logic of paying off multiple pending debts for a patient
-- in a single atomic transaction using a FIFO (First-In-First-Out) strategy.

DELIMITER //

CREATE OR REPLACE PROCEDURE proc_pay_patient_debt(
    IN p_patient_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_method VARCHAR(50),
    IN p_doctor_id INT,
    IN p_description_prefix VARCHAR(255)
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

    -- 1. Get User ID
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
            -- Partial payment: update current and create new pending for the rest
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
    END LOOP;

    CLOSE cur_debts;

    -- 2. Handle Advance Payment (if money still remains)
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
