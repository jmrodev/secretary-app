-- Optimization Migration: Stored Procedure for Appointment Booking
-- Priority: Database Level (Architecture Rule 15.3)
-- Ensures atomicity and consistency for booking operations.

DELIMITER //

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
    
    -- 1. Check for blocking appointments (excluding cancelled/absent/suspended)
    SELECT COUNT(*) INTO v_existing_active
    FROM appointments
    WHERE doctor_id = p_doctor_id 
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled', 'absent', 'suspended', 'reserved');
    
    IF v_existing_active > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'slot_already_taken';
    END IF;

    -- 2. Handle overwriting reservations (if any)
    -- This logic can be expanded here to match the service behavior
    
    -- 3. Create the appointment
    INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, reason, 
        is_out_of_hours, type, status, institution_id, bonified, created_at
    ) VALUES (
        p_patient_id, p_doctor_id, p_appointment_date, p_reason, 
        p_is_out_of_hours, p_type, 'pending', p_institution_id, p_bonified, NOW()
    );
    
    SET p_appointment_id = LAST_INSERT_ID();

    -- 4. Automatic Transaction Generation (Financial Logic in DB)
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
            
            -- Calculate what the patient pays
            SET v_patient_price = fn_calculate_service_price(p_doctor_id, p_patient_id, 'consultation', p_institution_id);
            
            -- Calculate what the institution pays (if any)
            IF p_institution_id IS NOT NULL THEN
                SELECT COALESCE(base_price, 0) INTO v_base_price FROM institutions WHERE id = p_institution_id;
                IF v_base_price > v_patient_price THEN
                    SET v_inst_share = v_base_price - v_patient_price;
                END IF;
            END IF;

            -- 4a. Patient Transaction (Debt or Paid)
            INSERT INTO transactions (
                type, amount, description, related_user_id, doctor_id, 
                institution_id, method, status, appointment_id, transaction_date
            ) VALUES (
                'income', v_patient_price, p_reason, v_pat_user_id,
                p_doctor_id, p_institution_id, 'on_account', 'pending', p_appointment_id, p_appointment_date
            );
            
            -- 4b. Institution Transaction (if share > 0)
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
END //

DELIMITER ;
