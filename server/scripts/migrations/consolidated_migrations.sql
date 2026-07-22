-- =============================================================================
-- Consolidated Migrations Script
-- Combines all database updates and prerequisites in the correct execution order.
-- =============================================================================

-- Prerequisites: Add missing columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rescheduled_from_date DATETIME NULL;

-- Prerequisites: Drop conflicting triggers to avoid 'already exists' errors
DROP TRIGGER IF EXISTS trg_audit_transaction_insert;
DROP TRIGGER IF EXISTS trg_audit_transaction_update;
DROP TRIGGER IF EXISTS trg_audit_transaction_delete;

-- Prerequisites: Initialize view_patients_extended
-- Optimization Migration: Refactored Extended Patient View (V3)
-- This version uses LEFT JOINs with pre-aggregated tables instead of correlated subqueries.
-- This is significantly more efficient for searching and listing patients.

CREATE OR REPLACE VIEW view_patients_extended AS
SELECT 
    p.*,
    u.username,
    u.role,
    
    -- Appointment Totals
    COALESCE(appt_stats.total_appointments, 0) as total_appointments,
    COALESCE(appt_stats.attended_appointments, 0) as attended_appointments,
    COALESCE(appt_stats.missed_appointments, 0) as missed_appointments,
    appt_stats.last_visit,

    -- Financial Stats (Debt)
    COALESCE(tx_stats.total_debt_calculated, 0) as total_debt_calculated,

    -- Financial Rating (1-5)
    CASE 
        WHEN COALESCE(tx_stats.total_debt_calculated, 0) <= 0 THEN 5
        WHEN tx_stats.total_debt_calculated < 1000 THEN 4
        WHEN tx_stats.total_debt_calculated < 5000 THEN 3
        WHEN tx_stats.total_debt_calculated < 10000 THEN 2
        ELSE 1 
    END as financial_rating,

    -- Attendance Rating (1-5)
    CASE 
        WHEN COALESCE(appt_stats.total_appointments, 0) = 0 THEN 5
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.95 THEN 5
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.85 THEN 4
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.70 THEN 3
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.50 THEN 2
        ELSE 1 
    END as attendance_rating

FROM patients p
JOIN users u ON p.user_id = u.id
LEFT JOIN (
    -- Pre-aggregated appointment stats
    SELECT 
        patient_id,
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status IN ('attended', 'completed') THEN 1 END) as attended_appointments,
        COUNT(CASE WHEN (status = 'absent' OR (status = 'cancelled' AND COALESCE(cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END) as missed_appointments,
        MAX(appointment_date) as last_visit
    FROM appointments
    GROUP BY patient_id
) appt_stats ON appt_stats.patient_id = p.id
LEFT JOIN (
    -- Pre-aggregated transaction stats (using the debt logic)
    -- We join with appointments to check the status filter
    SELECT 
        t.related_user_id,
        SUM(t.amount) as total_debt_calculated
    FROM transactions t
    LEFT JOIN appointments a ON t.appointment_id = a.id
    WHERE t.status = 'pending'
      AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
    GROUP BY t.related_user_id
) tx_stats ON tx_stats.related_user_id = p.user_id;



-- ==================================================
-- Migration File: 01_optimize_patient_search.sql
-- ==================================================

-- DB Optimization Migration: Patient Search Efficiency
-- Priority: Database Level Optimization (Architecture Rule 15.3)

-- 1. Standard B-Tree Indexes for fast lookups and sorting
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_dni ON patients(dni);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- 2. Full-Text Index for advanced multi-token searching
-- Note: Requires MyISAM or InnoDB (MariaDB supports FULLTEXT on both)
ALTER TABLE patients ADD FULLTEXT INDEX IF NOT EXISTS ft_idx_patient_search (full_name, dni, phone);



-- ==================================================
-- Migration File: 02_recent_patients_view.sql
-- ==================================================

-- Optimization Migration: Recent Activity View
-- Priority: Database Level Optimization (Architecture Rule 15.3)
-- This view provides "Smart Suggestions" based on actual system activity (appointments and edits).

CREATE OR REPLACE VIEW view_recent_patients AS
SELECT 
    p.id, 
    p.full_name, 
    p.dni, 
    p.phone, 
    p.total_debt_calculated,
    p.financial_rating,
    GREATEST(
        COALESCE((SELECT MAX(appointment_date) FROM appointments a WHERE a.patient_id = p.id), '1970-01-01'),
        COALESCE(p.marked_new_at, '1970-01-01')
    ) as last_activity
FROM view_patients_extended p
ORDER BY last_activity DESC
LIMIT 10;



-- ==================================================
-- Migration File: 03_finance_centralization.sql
-- ==================================================

-- Optimization Migration: Refined Finance Ledger
-- Priority: Database Level (Architecture Rule 15.3)
-- Centralizes the debt calculation logic based on the transactions table.

CREATE OR REPLACE VIEW view_patient_balances AS
SELECT 
    p.id as patient_id,
    p.full_name,
    p.user_id,
    COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as total_debt_calculated
FROM patients p
LEFT JOIN transactions t ON p.user_id = t.related_user_id
GROUP BY p.id;

-- Update the extended view to use this centralized balance
CREATE OR REPLACE VIEW view_patients_extended AS
SELECT 
    p.*,
    u.username,
    u.role,
    
    -- Appointment Totals (from pre-aggregated stats for performance)
    COALESCE(appt_stats.total_appointments, 0) as total_appointments,
    COALESCE(appt_stats.attended_appointments, 0) as attended_appointments,
    COALESCE(appt_stats.missed_appointments, 0) as missed_appointments,
    appt_stats.last_visit,

    -- Financial Stats from the centralized balance view
    COALESCE(b.total_debt_calculated, 0) as total_debt_calculated,

    -- Financial Rating (1-5) derived from the centralized balance
    CASE 
        WHEN COALESCE(b.total_debt_calculated, 0) <= 0 THEN 5
        WHEN b.total_debt_calculated < 1000 THEN 4
        WHEN b.total_debt_calculated < 5000 THEN 3
        WHEN b.total_debt_calculated < 10000 THEN 2
        ELSE 1 
    END as financial_rating,

    -- Attendance Rating (1-5)
    CASE 
        WHEN COALESCE(appt_stats.total_appointments, 0) = 0 THEN 5
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.95 THEN 5
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.85 THEN 4
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.70 THEN 3
        WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.50 THEN 2
        ELSE 1 
    END as attendance_rating

FROM patients p
JOIN users u ON p.user_id = u.id
LEFT JOIN view_patient_balances b ON p.id = b.patient_id
LEFT JOIN (
    SELECT 
        patient_id,
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status IN ('attended', 'completed') THEN 1 END) as attended_appointments,
        COUNT(CASE WHEN (status = 'absent' OR (status = 'cancelled' AND COALESCE(cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END) as missed_appointments,
        MAX(appointment_date) as last_visit
    FROM appointments
    GROUP BY patient_id
) appt_stats ON appt_stats.patient_id = p.id;



-- ==================================================
-- Migration File: 04_pricing_function.sql
-- ==================================================

-- Optimization Migration: Centralized Pricing & Finance Logic
-- Priority: Database Level (Architecture Rule 15.3)
-- This migration implements a deterministic pricing function in MariaDB.

DELIMITER //

CREATE OR REPLACE FUNCTION fn_calculate_service_price(
    p_doctor_id INT,
    p_patient_id INT,
    p_service_type VARCHAR(50),
    p_institution_id INT
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_base_price DECIMAL(10,2) DEFAULT 0;
    DECLARE v_final_price DECIMAL(10,2) DEFAULT 0;
    DECLARE v_tariff_percent INT DEFAULT 0;
    DECLARE v_tariff_override DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_inst_price DECIMAL(10,2) DEFAULT 0;

    -- 1. Get Doctor's Base Price
    SELECT 
        CASE p_service_type
            WHEN 'prescription' THEN COALESCE(prescription_price, 0)
            WHEN 'medical_license' THEN COALESCE(medical_license_price, 0)
            WHEN 'certificate' THEN COALESCE(certificate_price, 0)
            WHEN 'virtual_consultation' THEN COALESCE(virtual_consultation_price, 0)
            ELSE COALESCE(consultation_price, 0)
        END INTO v_base_price
    FROM doctors WHERE id = p_doctor_id;

    -- 2. Get Institution Price if provided (override base)
    IF p_institution_id IS NOT NULL THEN
        SELECT COALESCE(base_price, 0) INTO v_inst_price FROM institutions WHERE id = p_institution_id;
    END IF;

    -- 3. Get Patient Data
    IF p_patient_id IS NOT NULL THEN
        SELECT COALESCE(tariff_percent, 0), tariff_override 
        INTO v_tariff_percent, v_tariff_override
        FROM patients WHERE id = p_patient_id;
    END IF;

    -- 4. Logic Calculation
    SET v_final_price = v_base_price;
    
    IF v_inst_price > 0 THEN
        SET v_base_price = v_inst_price;
        SET v_final_price = 0; -- Initial share is covered by institution
    END IF;

    -- Apply Override (only for standard consultation)
    IF v_tariff_override > 0 AND (p_service_type = 'consultation' OR p_service_type IS NULL OR p_service_type = '') THEN
        SET v_final_price = v_tariff_override;
    ELSEIF v_tariff_percent != 0 THEN
        -- Apply Adjustment Percent over the active Base Price
        SET v_final_price = v_final_price + (v_base_price * (v_tariff_percent / 100));
    END IF;

    RETURN v_final_price;
END //

DELIMITER ;



-- ==================================================
-- Migration File: 05_fifo_payment_procedure.sql
-- ==================================================

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



-- ==================================================
-- Migration File: 06_finance_alerts_reconciliation.sql
-- ==================================================

-- Optimization Migration: Finance Alerts & Cash Reconciliation
-- Priority: Database Level (Architecture Rule 15.3)
-- Implements debt aging alerts and daily cash reconciliation views.

-- 1. Enhanced Balance View with Aging Alerts
CREATE OR REPLACE VIEW view_patient_balances AS
SELECT 
    p.id as patient_id,
    p.full_name,
    p.user_id,
    COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as total_debt_calculated,
    -- Debt Status: Green (0), Yellow (<30 days), Red (>30 days or high amount)
    CASE 
        WHEN COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) <= 0 THEN 'green'
        WHEN MAX(CASE WHEN t.status = 'pending' THEN DATEDIFF(NOW(), t.transaction_date) ELSE 0 END) > 30 THEN 'red'
        WHEN SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END) > 20000 THEN 'red'
        ELSE 'yellow'
    END as debt_status,
    -- Days since oldest debt
    MAX(CASE WHEN t.status = 'pending' THEN DATEDIFF(NOW(), t.transaction_date) ELSE 0 END) as oldest_debt_days
FROM patients p
LEFT JOIN transactions t ON p.user_id = t.related_user_id
GROUP BY p.id;

-- 2. Daily Cash Reconciliation View
-- Shows total revenue by method for the current day
CREATE OR REPLACE VIEW view_daily_cash_reconciliation AS
SELECT 
    COALESCE(t.method, 'TOTAL') as payment_method,
    SUM(CASE WHEN t.is_withdrawal = 0 THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.is_withdrawal = 1 THEN t.amount ELSE 0 END) as total_withdrawal,
    (SUM(CASE WHEN t.is_withdrawal = 0 THEN t.amount ELSE 0 END) - SUM(CASE WHEN t.is_withdrawal = 1 THEN t.amount ELSE 0 END)) as net_balance
FROM transactions t
WHERE DATE(t.transaction_date) = CURDATE() AND t.status = 'paid'
GROUP BY t.method WITH ROLLUP;

-- 3. Update view_patients_extended to include debt_status
CREATE OR REPLACE VIEW view_patients_extended AS
SELECT 
    p.*,
    u.username,
    u.role,
    COALESCE(appt_stats.total_appointments, 0) as total_appointments,
    COALESCE(appt_stats.attended_appointments, 0) as attended_appointments,
    COALESCE(appt_stats.missed_appointments, 0) as missed_appointments,
    appt_stats.last_visit,
    COALESCE(b.total_debt_calculated, 0) as total_debt_calculated,
    COALESCE(b.debt_status, 'green') as debt_status,
    b.oldest_debt_days,
    CASE 
        WHEN COALESCE(b.total_debt_calculated, 0) <= 0 THEN 5
        WHEN b.total_debt_calculated < 1000 THEN 4
        WHEN b.total_debt_calculated < 5000 THEN 3
        WHEN b.total_debt_calculated < 10000 THEN 2
        ELSE 1 
    END as financial_rating
FROM patients p
JOIN users u ON p.user_id = u.id
LEFT JOIN view_patient_balances b ON p.id = b.patient_id
LEFT JOIN (
    SELECT 
        patient_id,
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status IN ('attended', 'completed') THEN 1 END) as attended_appointments,
        COUNT(CASE WHEN (status = 'absent' OR (status = 'cancelled' AND COALESCE(cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END) as missed_appointments,
        MAX(appointment_date) as last_visit
    FROM appointments
    GROUP BY patient_id
) appt_stats ON appt_stats.patient_id = p.id;



-- ==================================================
-- Migration File: 07_update_recent_patients_view.sql
-- ==================================================

-- Optimization Migration: Update Recent Patients View
-- Priority: Database Level (Architecture Rule 15.3)
-- Adds debt_status and total_debt to the recent patients view for Smart Suggestions.

CREATE OR REPLACE VIEW view_recent_patients AS
SELECT 
    p.id, 
    p.full_name, 
    p.dni, 
    p.phone, 
    p.total_debt_calculated,
    p.debt_status,
    p.financial_rating,
    GREATEST(
        COALESCE((SELECT MAX(appointment_date) FROM appointments a WHERE a.patient_id = p.id), '1970-01-01'),
        COALESCE(p.marked_new_at, '1970-01-01')
    ) as last_activity
FROM view_patients_extended p
ORDER BY last_activity DESC
LIMIT 10;



-- ==================================================
-- Migration File: 08_booking_stored_procedure.sql
-- ==================================================

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



-- ==================================================
-- Migration File: 09_daily_balance_view.sql
-- ==================================================

-- Optimization Migration: Daily Balance View and Indexing
-- Priority: Database Level (Architecture Rule 15.3)

-- 1. Optimized view for daily balances per doctor and payment method
CREATE OR REPLACE VIEW view_daily_balances AS
SELECT 
    DATE(t.transaction_date) as transaction_date,
    t.doctor_id,
    d.full_name as doctor_name,
    SUM(CASE WHEN t.method = 'cash' THEN 
        CASE WHEN t.is_withdrawal = 1 THEN -t.amount 
             WHEN (t.type LIKE 'income%' OR t.type = 'income') THEN t.amount 
             WHEN (t.type LIKE 'expense%' OR t.type = 'expense') THEN -t.amount 
             ELSE 0 END 
        ELSE 0 END) as cash_balance,
    SUM(CASE WHEN t.method != 'cash' THEN 
        CASE WHEN t.is_withdrawal = 1 THEN -t.amount 
             WHEN (t.type LIKE 'income%' OR t.type = 'income') THEN t.amount 
             WHEN (t.type LIKE 'expense%' OR t.type = 'expense') THEN -t.amount 
             ELSE 0 END 
        ELSE 0 END) as transfer_balance,
    MAX(t.transaction_date) as last_activity
FROM transactions t
LEFT JOIN doctors d ON t.doctor_id = d.id
WHERE t.status = 'paid'
GROUP BY DATE(t.transaction_date), t.doctor_id;

-- 2. Indexes for financial performance
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_finance_reconcile (transaction_date, status, doctor_id, method);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_patient_debt (related_user_id, status, amount);

-- 3. Audit Table for Transactions (Traceability)
CREATE TABLE IF NOT EXISTS transaction_audits (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    action ENUM('INSERT', 'UPDATE', 'DELETE'),
    old_amount DECIMAL(15,2),
    new_amount DECIMAL(15,2),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by_user_id INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit Triggers
DELIMITER //

CREATE TRIGGER trg_audit_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO transaction_audits (transaction_id, action, new_amount, new_status, changed_at)
    VALUES (NEW.id, 'INSERT', NEW.amount, NEW.status, NOW());
END; //

CREATE TRIGGER trg_audit_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    IF OLD.amount != NEW.amount OR OLD.status != NEW.status THEN
        INSERT INTO transaction_audits (transaction_id, action, old_amount, new_amount, old_status, new_status, changed_at)
        VALUES (NEW.id, 'UPDATE', OLD.amount, NEW.amount, OLD.status, NEW.status, NOW());
    END IF;
END; //

CREATE TRIGGER trg_audit_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO transaction_audits (transaction_id, action, old_amount, old_status, changed_at)
    VALUES (OLD.id, 'DELETE', OLD.amount, OLD.status, NOW());
END; //

DELIMITER ;



-- ==================================================
-- Migration File: 10_financial_health_view.sql
-- ==================================================

-- Optimization Migration: Financial Health Metrics
-- Priority: Database Level (Architecture Rule 15.3)

CREATE OR REPLACE VIEW view_doctor_financial_health AS
SELECT 
    d.id as doctor_id,
    d.full_name as doctor_name,
    COALESCE(SUM(CASE WHEN t.status = 'paid' AND t.is_withdrawal = 0 THEN t.amount ELSE 0 END), 0) as total_collected,
    COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as total_debt,
    CASE 
        WHEN SUM(CASE WHEN t.is_withdrawal = 0 THEN t.amount ELSE 0 END) = 0 THEN 100
        ELSE (SUM(CASE WHEN t.status = 'paid' AND t.is_withdrawal = 0 THEN t.amount ELSE 0 END) / 
              SUM(CASE WHEN t.is_withdrawal = 0 THEN t.amount ELSE 0 END)) * 100 
    END as collection_rate_percent,
    -- Average days to pay (using the audit log for the 'paid' transition)
    (SELECT AVG(DATEDIFF(ta.changed_at, t2.transaction_date))
     FROM transaction_audits ta
     JOIN transactions t2 ON ta.transaction_id = t2.id
     WHERE t2.doctor_id = d.id 
       AND ta.new_status = 'paid' 
       AND ta.old_status = 'pending'
    ) as avg_days_to_collect
FROM doctors d
LEFT JOIN transactions t ON d.id = t.doctor_id
GROUP BY d.id;



-- ==================================================
-- Migration File: 11_appointment_details_view.sql
-- ==================================================

-- Migration 11: Appointment Details View and Performance Optimization
-- Goal: Centralize appointment logic and financial calculations in the DB.

-- 1. Optimization Indexes
-- Improve transaction aggregation performance
CREATE INDEX IF NOT EXISTS idx_transactions_appointment_status_withdrawal 
ON transactions(appointment_id, status, is_withdrawal);

-- 2. Create the Centralized View
CREATE OR REPLACE VIEW v_appointment_details AS
SELECT 
    a.id,
    a.appointment_date,
    a.reason,
    a.status,
    a.payment_status,
    a.type,
    a.is_out_of_hours,
    a.bonified,
    a.cost,
    a.google_event_id,
    a.rescheduled_from_date,
    a.duration,
    a.patient_id,
    p.full_name AS patient_name,
    p.dni AS patient_dni,
    p.phone AS patient_phone,
    p.behavior_rating,
    a.doctor_id,
    d.full_name AS doctor_name,
    d.afip_cuit AS doctor_cuit,
    a.institution_id,
    inst.name AS institution_name,
    inst.base_price AS institution_base_price,
    -- Financial aggregation
    COALESCE(tx.paid_amount, 0) AS paid_amount,
    COALESCE(tx.pending_amount, 0) AS pending_amount,
    -- Invoice data
    inv.invoice_number,
    inv.invoice_punto_vta,
    inv.invoice_cae,
    -- Patient metrics (Calculated once in DB)
    (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = a.patient_id AND a2.status IN ('attended', 'completed')) as attended_appointments
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN institutions inst ON a.institution_id = inst.id
LEFT JOIN (
    SELECT 
        appointment_id,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount
    FROM transactions
    WHERE is_withdrawal = 0
    GROUP BY appointment_id
) tx ON tx.appointment_id = a.id
LEFT JOIN (
    SELECT 
        t.appointment_id,
        MIN(i.cbte_nro) AS invoice_number,
        MIN(i.punto_vta) AS invoice_punto_vta,
        MIN(i.cae) AS invoice_cae
    FROM invoices i
    JOIN transactions t ON i.transaction_id = t.id
    WHERE t.appointment_id IS NOT NULL
    GROUP BY t.appointment_id
) inv ON inv.appointment_id = a.id;



-- ==================================================
-- Migration File: 12_add_patients_fulltext_index.sql
-- ==================================================

-- Migration 12: Add Fulltext search index to patients
-- Goal: Fix patient search functionality which depends on MATCH AGAINST.

ALTER TABLE patients ADD FULLTEXT INDEX IF NOT EXISTS idx_patients_search (full_name, dni, phone);



-- ==================================================
-- Migration File: 13_daily_financial_summary_view.sql
-- ==================================================

-- Migration 13: Daily Financial Summary View
-- Goal: Centralize financial report calculations in SQL (SQL-First principle).

CREATE OR REPLACE VIEW view_daily_financial_summary AS
SELECT 
    DATE(transaction_date) as report_date,
    doctor_id,
    SUM(CASE WHEN is_withdrawal = 0 AND status = 'paid' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN is_withdrawal = 0 AND status = 'paid' AND (method = 'cash' OR method = 'efectivo') THEN amount ELSE 0 END) as total_cash,
    SUM(CASE WHEN is_withdrawal = 1 AND status = 'paid' THEN amount ELSE 0 END) as total_withdrawal
FROM transactions
GROUP BY DATE(transaction_date), doctor_id;



-- ==================================================
-- Migration File: 14_medical_request_details_view.sql
-- ==================================================

-- Migration 14: Medical Request Details View and Performance Optimization
-- Goal: Centralize medical request queries and financial aggregations in SQL (SQL-First principle).

-- 1. Optimization Indexes
-- Optimize transactions join for medical request paid/pending amounts
CREATE INDEX IF NOT EXISTS idx_transactions_request_status_amount
ON transactions(request_id, status, amount);

-- 2. Create the Centralized View
CREATE OR REPLACE VIEW v_medical_request_details AS
SELECT 
    r.id,
    r.type,
    r.patient_id,
    p.full_name AS patient_name,
    p.user_id AS patient_user_id,
    r.doctor_id,
    d.full_name AS doctor_name,
    d.user_id AS doctor_user_id,
    r.secretary_id,
    r.status,
    r.request_note,
    r.doctor_note,
    r.created_at,
    r.updated_at,
    r.payment_status,
    r.payment_method,
    r.debt_amount,
    r.completed_at,
    r.raw_medication_data,
    r.is_patient_submitted,
    -- Financial fields
    COALESCE(NULLIF(r.debt_amount, 0), 0) AS resolved_debt_amount,
    COALESCE(tx.paid_amount, 0) AS paid_amount,
    COALESCE(tx.pending_amount, 0) AS pending_amount
FROM medical_requests r
LEFT JOIN patients p ON r.patient_id = p.id
LEFT JOIN doctors d ON r.doctor_id = d.id
LEFT JOIN (
    SELECT 
        request_id,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount
    FROM transactions
    WHERE is_withdrawal = 0 AND request_id IS NOT NULL
    GROUP BY request_id
) tx ON tx.request_id = r.id;



-- ==================================================
-- Migration File: 15_availability_stored_procedures.sql
-- ==================================================

-- Migration 15: Availability and Search Stored Procedures
-- Goal: Recreate missing database procedures sp_search_appointments, sp_get_daily_schedule, and sp_get_free_slots.

DELIMITER //

-- 1. Search Appointments Procedure
CREATE OR REPLACE PROCEDURE sp_search_appointments(
    IN p_search VARCHAR(255),
    IN p_doctor_id INT,
    IN p_patient_id INT,
    IN p_status VARCHAR(50),
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_page INT,
    IN p_limit INT,
    OUT p_total_count INT
)
BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;

    -- Calculate total count
    SELECT COUNT(*) INTO p_total_count
    FROM v_appointment_details
    WHERE (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
      AND (p_patient_id IS NULL OR patient_id = p_patient_id)
      AND (p_status IS NULL OR status = p_status)
      AND (p_start_date IS NULL OR appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR appointment_date <= p_end_date)
      AND (
          p_search = '' 
          OR patient_name LIKE CONCAT('%', p_search, '%')
          OR patient_dni LIKE CONCAT('%', p_search, '%')
          OR patient_phone LIKE CONCAT('%', p_search, '%')
          OR reason LIKE CONCAT('%', p_search, '%')
      );

    -- Select page of results
    SELECT *
    FROM v_appointment_details
    WHERE (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
      AND (p_patient_id IS NULL OR patient_id = p_patient_id)
      AND (p_status IS NULL OR status = p_status)
      AND (p_start_date IS NULL OR appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR appointment_date <= p_end_date)
      AND (
          p_search = '' 
          OR patient_name LIKE CONCAT('%', p_search, '%')
          OR patient_dni LIKE CONCAT('%', p_search, '%')
          OR patient_phone LIKE CONCAT('%', p_search, '%')
          OR reason LIKE CONCAT('%', p_search, '%')
      )
    ORDER BY appointment_date DESC
    LIMIT p_limit OFFSET v_offset;
END //

-- 2. Daily Schedule Slots Generation Procedure
CREATE OR REPLACE PROCEDURE sp_get_daily_schedule(
    IN p_doctor_id INT,
    IN p_date_str VARCHAR(10)
)
BEGIN
    DECLARE v_duration INT;
    DECLARE v_overturn_start TIME;
    DECLARE v_overturn_end TIME;
    DECLARE v_force_alignment TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_slot_dur INT;
    DECLARE v_date DATE;
    DECLARE v_day_of_week INT;
    DECLARE v_is_holiday TINYINT DEFAULT 0;

    -- Temp table to store generated slots
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_slots;

    SET v_date = STR_TO_DATE(p_date_str, '%Y-%m-%d');
    SET v_day_of_week = DAYOFWEEK(v_date) - 1; -- DAYOFWEEK returns 1 for Sunday, 2 for Monday, etc. So 0 for Sunday, 1 for Monday...

    -- Check if it is a holiday
    SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_date;

    -- Get doctor configuration
    SELECT 
        COALESCE(appointment_duration, 60), 
        COALESCE(overturn_start_time, '08:00:00'), 
        COALESCE(overturn_end_time, '21:00:00'),
        COALESCE(force_hour_alignment, 0)
    INTO 
        v_duration, 
        v_overturn_start, 
        v_overturn_end,
        v_force_alignment
    FROM doctors 
    WHERE id = p_doctor_id;

    SET v_current_time = v_overturn_start;

    -- Loop to generate time slots
    WHILE v_current_time < v_overturn_end DO
        SET v_slot_dur = v_duration;
        
        IF v_force_alignment = 1 AND (TIME_TO_SEC(v_current_time) % 3600) != 0 THEN
            SET v_slot_dur = 60 - ((TIME_TO_SEC(v_current_time) % 3600) / 60);
        END IF;

        IF TIME_TO_SEC(v_current_time) + (v_slot_dur * 60) > TIME_TO_SEC(v_overturn_end) THEN
            SET v_current_time = v_overturn_end;
        ELSE
            BEGIN
                DECLARE v_is_official TINYINT DEFAULT 0;
                DECLARE v_is_break TINYINT DEFAULT 0;
                DECLARE v_status VARCHAR(50);

                IF v_is_holiday = 1 THEN
                    SET v_status = 'closed_holiday';
                ELSE
                    -- Check if falls in official work schedules
                    SELECT COUNT(*) INTO v_is_official
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 0
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    -- Check if falls in break
                    SELECT COUNT(*) INTO v_is_break
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 1
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    IF v_is_break > 0 THEN
                        SET v_status = 'break';
                    ELSEIF v_is_official > 0 THEN
                        SET v_status = 'free';
                    ELSE
                        SET v_status = 'out_of_hours';
                    END IF;
                END IF;

                INSERT INTO temp_slots (slot_date, slot_time, slot_status, is_out_of_hours)
                VALUES (v_date, v_current_time, v_status, CASE WHEN v_status = 'out_of_hours' THEN 1 ELSE 0 END);
            END;

            SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_dur * 60));
        END IF;
    END WHILE;

    -- Select slot details joined with appointments
    SELECT 
        a.id,
        a.appointment_date,
        p_doctor_id as doctor_id,
        d.full_name as doctor_name,
        a.patient_id,
        a.patient_name,
        a.patient_phone,
        a.status,
        a.reason,
        a.type,
        ts.is_out_of_hours,
        a.paid_amount,
        a.pending_amount,
        a.cost,
        a.rescheduled_from_date,
        ts.slot_date,
        ts.slot_time,
        CASE 
            WHEN a.id IS NOT NULL THEN 'taken' 
            ELSE ts.slot_status 
        END as slot_status
    FROM temp_slots ts
    LEFT JOIN v_appointment_details a 
        ON a.doctor_id = p_doctor_id 
        AND DATE(a.appointment_date) = ts.slot_date 
        AND TIME(a.appointment_date) = ts.slot_time
        AND a.status NOT IN ('cancelled', 'suspended')
    LEFT JOIN doctors d ON d.id = p_doctor_id
    ORDER BY ts.slot_time;
END //

-- 3. Free Slots Generation Procedure
CREATE OR REPLACE PROCEDURE sp_get_free_slots(
    IN p_doctor_id INT,
    IN p_start_date_str VARCHAR(19),
    IN p_days_to_check INT,
    IN p_include_out_of_hours INT
)
BEGIN
    DECLARE v_days_counter INT DEFAULT 0;
    DECLARE v_current_date DATE;
    DECLARE v_duration INT;
    DECLARE v_overturn_start TIME;
    DECLARE v_overturn_end TIME;
    DECLARE v_force_alignment TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_slot_dur INT;
    DECLARE v_day_of_week INT;
    DECLARE v_is_holiday TINYINT;

    -- Temp table to store all generated slots across the date range
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_all_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_break TINYINT,
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_all_slots;

    -- Get doctor configuration
    SELECT 
        COALESCE(appointment_duration, 60), 
        COALESCE(overturn_start_time, '08:00:00'), 
        COALESCE(overturn_end_time, '21:00:00'),
        COALESCE(force_hour_alignment, 0)
    INTO 
        v_duration, 
        v_overturn_start, 
        v_overturn_end,
        v_force_alignment
    FROM doctors 
    WHERE id = p_doctor_id;

    -- Loop through each day
    WHILE v_days_counter < p_days_to_check DO
        SET v_current_date = DATE_ADD(STR_TO_DATE(p_start_date_str, '%Y-%m-%d'), INTERVAL v_days_counter DAY);
        SET v_day_of_week = DAYOFWEEK(v_current_date) - 1;

        -- Check if holiday
        SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_current_date;

        IF v_is_holiday = 0 THEN
            SET v_current_time = v_overturn_start;

            -- Generate slots for the day
            WHILE v_current_time < v_overturn_end DO
                SET v_slot_dur = v_duration;
                
                IF v_force_alignment = 1 AND (TIME_TO_SEC(v_current_time) % 3600) != 0 THEN
                    SET v_slot_dur = 60 - ((TIME_TO_SEC(v_current_time) % 3600) / 60);
                END IF;

                IF TIME_TO_SEC(v_current_time) + (v_slot_dur * 60) > TIME_TO_SEC(v_overturn_end) THEN
                    SET v_current_time = v_overturn_end;
                ELSE
                    BEGIN
                        DECLARE v_is_official TINYINT DEFAULT 0;
                        DECLARE v_is_break TINYINT DEFAULT 0;
                        DECLARE v_status VARCHAR(50);

                        -- Check official schedule
                        SELECT COUNT(*) INTO v_is_official
                        FROM doctor_schedules
                        WHERE doctor_id = p_doctor_id
                          AND day_of_week = v_day_of_week
                          AND is_break = 0
                          AND v_current_time >= start_time
                          AND v_current_time < end_time;

                        -- Check break
                        SELECT COUNT(*) INTO v_is_break
                        FROM doctor_schedules
                        WHERE doctor_id = p_doctor_id
                          AND day_of_week = v_day_of_week
                          AND is_break = 1
                          AND v_current_time >= start_time
                          AND v_current_time < end_time;

                        IF v_is_break > 0 THEN
                            SET v_status = 'break';
                        ELSEIF v_is_official > 0 THEN
                            SET v_status = 'free';
                        ELSE
                            SET v_status = 'out_of_hours';
                        END IF;

                        -- Insert only if it's a valid slot to show
                        IF v_status = 'free' OR v_status = 'break' OR (p_include_out_of_hours = 1 AND v_status = 'out_of_hours') THEN
                            INSERT INTO temp_all_slots (slot_date, slot_time, slot_status, is_break, is_out_of_hours)
                            VALUES (v_current_date, v_current_time, v_status, CASE WHEN v_status = 'break' THEN 1 ELSE 0 END, CASE WHEN v_status = 'out_of_hours' THEN 1 ELSE 0 END);
                        END IF;
                    END;

                    SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_dur * 60));
                END IF;
            END WHILE;
        END IF;

        SET v_days_counter = v_days_counter + 1;
    END WHILE;

    -- Return free slots (no overlapping appointments)
    SELECT 
        ts.slot_date as date,
        TIME_FORMAT(ts.slot_time, '%H:%i') as time,
        CONCAT(ts.slot_date, 'T', ts.slot_time, '-03:00') as iso,
        ts.is_break,
        ts.is_out_of_hours
    FROM temp_all_slots ts
    LEFT JOIN appointments a 
        ON a.doctor_id = p_doctor_id 
        AND DATE(a.appointment_date) = ts.slot_date 
        AND TIME(a.appointment_date) = ts.slot_time
        AND a.status NOT IN ('cancelled', 'suspended')
    WHERE a.id IS NULL
      AND ts.slot_status != 'break'
    ORDER BY ts.slot_date, ts.slot_time;
END //

DELIMITER ;



-- ==================================================
-- Migration File: 16_create_transaction_procedure.sql
-- ==================================================

-- Migration 16: Stored Procedure for Transaction Creation
-- Provides atomic INSERT into transactions table.
-- p_idempotency_key is accepted for API compatibility but not stored (column doesn't exist yet).

DELIMITER //

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
        request_id
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
        p_request_id
    );

    SET p_id = LAST_INSERT_ID();
END //

DELIMITER ;



-- ==================================================
-- Migration File: 17_missing_procedures.sql
-- ==================================================

-- =============================================================================
-- Migration 17: Stored procedures faltantes en la BD
-- Creado: 2026-06-26
-- Refs: patientRepository, patientService, financeService
-- =============================================================================

DELIMITER //

-- ---------------------------------------------------------------------------
-- 1. sp_search_patients
--    Parámetros (en orden exacto que llama el backend):
--      p_search      VARCHAR  — texto libre (nombre, DNI, teléfono)
--      p_page        INT      — página (1-based)
--      p_limit       INT      — registros por página
--      p_doctor_id   INT      — filtro por doctor asignado (NULL = todos)
--      p_role        VARCHAR  — rol del usuario que busca
--      p_user_id     INT      — id del usuario que busca
--      OUT p_total   INT      — total de registros sin paginar
--
--    Reglas de negocio:
--      - role='doctor': sólo muestra pacientes asignados a ese doctor
--      - role='admin'|'secretary': muestra todos
--      - busca en full_name, dni, phone (usa el índice FULLTEXT si hay término)
--      - ordena por full_name ASC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_search_patients(
    IN  p_search    VARCHAR(255),
    IN  p_page      INT,
    IN  p_limit     INT,
    IN  p_doctor_id INT,
    IN  p_role      VARCHAR(50),
    IN  p_user_id   INT,
    OUT p_total     INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_doctor_id_for_user INT DEFAULT NULL;

    SET v_offset = (COALESCE(p_page, 1) - 1) * COALESCE(p_limit, 50);

    -- Si el rol es 'doctor', resolvemos qué doctor_id le pertenece
    IF p_role = 'doctor' THEN
        SELECT id INTO v_doctor_id_for_user
        FROM doctors
        WHERE user_id = p_user_id
        LIMIT 1;
    END IF;

    -- Crear tabla temporal con el universo filtrado (sin paginación)
    DROP TEMPORARY TABLE IF EXISTS _tmp_patient_search;
    CREATE TEMPORARY TABLE _tmp_patient_search AS
    SELECT p.id
    FROM view_patients_extended p
    WHERE
        -- Filtro de rol: si es doctor sólo ve sus pacientes
        (p_role NOT IN ('doctor') OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = v_doctor_id_for_user
        ))
        -- Filtro adicional por doctor_id explícito
        AND (p_doctor_id IS NULL OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = p_doctor_id
        ))
        -- Búsqueda por texto
        AND (
            p_search IS NULL OR p_search = ''
            OR MATCH(p.full_name, p.dni, p.phone) AGAINST (p_search IN BOOLEAN MODE)
            OR p.full_name LIKE CONCAT('%', p_search, '%')
            OR p.dni LIKE CONCAT('%', p_search, '%')
            OR p.phone LIKE CONCAT('%', p_search, '%')
        );

    -- Total de resultados
    SELECT COUNT(*) INTO p_total FROM _tmp_patient_search;

    -- Resultados paginados
    SELECT p.*
    FROM view_patients_extended p
    INNER JOIN _tmp_patient_search t ON t.id = p.id
    ORDER BY p.full_name ASC
    LIMIT p_limit OFFSET v_offset;

    DROP TEMPORARY TABLE IF EXISTS _tmp_patient_search;
END //


-- ---------------------------------------------------------------------------
-- 2. sp_get_search_suggestions
--    Devuelve hasta 10 pacientes recientes como sugerencias rápidas.
--    Parámetros:
--      p_user_id  INT         — id del usuario
--      p_role     VARCHAR(50) — rol del usuario
--
--    Si es doctor, sólo retorna sus propios pacientes.
--    Ordena por última actividad DESC.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_get_search_suggestions(
    IN p_user_id INT,
    IN p_role    VARCHAR(50)
)
BEGIN
    DECLARE v_doctor_id INT DEFAULT NULL;

    IF p_role = 'doctor' THEN
        SELECT id INTO v_doctor_id
        FROM doctors
        WHERE user_id = p_user_id
        LIMIT 1;
    END IF;

    SELECT
        p.id,
        p.full_name,
        p.dni,
        p.phone,
        p.total_debt_calculated,
        p.debt_status,
        p.last_activity
    FROM view_recent_patients p
    WHERE
        p_role NOT IN ('doctor')
        OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = v_doctor_id
        )
    ORDER BY p.last_activity DESC
    LIMIT 10;
END //


-- ---------------------------------------------------------------------------
-- 3. sp_sync_request_payment_status
--    Recalcula y actualiza el payment_status de una medical_request
--    según las transacciones asociadas.
--    Parámetros:
--      p_request_id INT — id de la medical_request a sincronizar
--
--    Lógica:
--      - Sin transacciones               → 'pending'
--      - Todas bonified/amount=0        → 'bonified'
--      - Todas paid                     → 'paid'
--      - Alguna pending, alguna paid    → 'partial'
--      - Todas pending                  → 'debt'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_sync_request_payment_status(
    IN p_request_id INT
)
BEGIN
    DECLARE v_total_amount   DECIMAL(15,2) DEFAULT 0;
    DECLARE v_paid_amount    DECIMAL(15,2) DEFAULT 0;
    DECLARE v_pending_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_bonified_count INT DEFAULT 0;
    DECLARE v_total_rows     INT DEFAULT 0;
    DECLARE v_new_status     VARCHAR(50);
    DECLARE v_debt_amount    DECIMAL(15,2) DEFAULT 0;

    SELECT
        COUNT(*)                                           INTO v_total_rows
    FROM transactions
    WHERE request_id = p_request_id;

    SELECT
        COALESCE(SUM(amount), 0)                           INTO v_total_amount
    FROM transactions
    WHERE request_id = p_request_id;

    SELECT
        COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN method = 'bonified' OR amount = 0 THEN 1 ELSE 0 END), 0)
    INTO v_paid_amount, v_pending_amount, v_bonified_count
    FROM transactions
    WHERE request_id = p_request_id;

    -- Determinar nuevo status
    IF v_total_rows = 0 THEN
        SET v_new_status = 'pending';
        SET v_debt_amount = 0;
    ELSEIF v_bonified_count = v_total_rows THEN
        SET v_new_status = 'bonified';
        SET v_debt_amount = 0;
    ELSEIF v_pending_amount = 0 THEN
        SET v_new_status = 'paid';
        SET v_debt_amount = 0;
    ELSEIF v_paid_amount = 0 THEN
        SET v_new_status = 'debt';
        SET v_debt_amount = v_pending_amount;
    ELSE
        SET v_new_status = 'partial';
        SET v_debt_amount = v_pending_amount;
    END IF;

    UPDATE medical_requests
    SET
        payment_status = v_new_status,
        debt_amount    = v_debt_amount
    WHERE id = p_request_id;
END //

DELIMITER ;



-- ==================================================
-- Migration File: 18_missing_tables_and_sp_bonified.sql
-- ==================================================

-- =============================================================================
-- Migration 18: Tablas y procedimiento faltantes
-- Creado: 2026-06-26
-- 1. whatsapp_messages     — mensajes entrantes/salientes de WhatsApp
-- 2. cash_box_balancings   — registros de arqueo de caja
-- 3. sp_mark_as_bonified   — bonifica las transacciones de un turno/receta
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. whatsapp_messages
--    Columnas inferidas de whatsappRepository.js:
--      patient_id    INT         — FK patients (puede ser NULL si aún no vinculado)
--      sender_phone  VARCHAR     — teléfono del que envió
--      direction     ENUM        — 'inbound' | 'outbound'
--      body          TEXT        — contenido del mensaje
--      whatsapp_id   VARCHAR     — ID único de WhatsApp (para dedup y status updates)
--      status        VARCHAR     — 'sent' | 'delivered' | 'read' | 'failed'
--      created_at    TIMESTAMP   — fecha de creación
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
    `id`           INT(11)      NOT NULL AUTO_INCREMENT,
    `patient_id`   INT(11)      DEFAULT NULL,
    `sender_phone` VARCHAR(50)  DEFAULT NULL,
    `direction`    ENUM('inbound','outbound') NOT NULL DEFAULT 'inbound',
    `body`         TEXT         DEFAULT NULL,
    `whatsapp_id`  VARCHAR(255) DEFAULT NULL,
    `status`       VARCHAR(50)  NOT NULL DEFAULT 'sent',
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_whatsapp_id` (`whatsapp_id`),
    KEY `idx_wm_patient`       (`patient_id`),
    KEY `idx_wm_sender_phone`  (`sender_phone`),
    KEY `idx_wm_created_at`    (`created_at`),
    CONSTRAINT `fk_wm_patient`
        FOREIGN KEY (`patient_id`)
        REFERENCES `patients` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ---------------------------------------------------------------------------
-- 2. cash_box_balancings
--    Columnas inferidas de financeService.js performBalancing():
--      doctor_id             INT          — doctor que cierra caja
--      balancing_date        DATE         — fecha del arqueo
--      theoretical_balance   DECIMAL      — saldo calculado por el sistema
--      physical_balance      DECIMAL      — saldo contado físicamente
--      difference            DECIMAL      — diferencia (físico - teórico)
--      notes                 TEXT         — observaciones
--      created_at            TIMESTAMP    — fecha de registro
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cash_box_balancings` (
    `id`                   INT(11)       NOT NULL AUTO_INCREMENT,
    `doctor_id`            INT(11)       DEFAULT NULL,
    `balancing_date`       DATE          NOT NULL,
    `theoretical_balance`  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `physical_balance`     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `difference`           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `notes`                TEXT          DEFAULT NULL,
    `created_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cb_doctor`   (`doctor_id`),
    KEY `idx_cb_date`     (`balancing_date`),
    CONSTRAINT `fk_cb_doctor`
        FOREIGN KEY (`doctor_id`)
        REFERENCES `doctors` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ---------------------------------------------------------------------------
-- 3. sp_mark_as_bonified
--    Marca como bonificadas todas las transacciones asociadas a un turno
--    o a una receta (type = 'appointment' | 'prescription').
--
--    Parámetros:
--      p_id    INT         — appointment_id o request_id
--      p_type  VARCHAR(50) — 'appointment' | 'prescription'
--
--    Lo que hace:
--      - Pone amount = 0, method = 'bonified', status = 'paid'
--        en todas las transacciones relacionadas.
--      - Si es appointment, también actualiza appointments.bonified = 1.
-- ---------------------------------------------------------------------------
DELIMITER //

CREATE OR REPLACE PROCEDURE sp_mark_as_bonified(
    IN p_id   INT,
    IN p_type VARCHAR(50)
)
BEGIN
    IF p_type = 'appointment' THEN
        UPDATE transactions
        SET
            amount  = 0,
            method  = 'bonified',
            status  = 'paid'
        WHERE appointment_id = p_id;

        -- Marcar el turno como bonificado
        UPDATE appointments
        SET bonified = 1
        WHERE id = p_id;

    ELSEIF p_type = 'prescription' THEN
        -- Las recetas guardan su vínculo financiero por request_id
        UPDATE transactions
        SET
            amount  = 0,
            method  = 'bonified',
            status  = 'paid'
        WHERE request_id = p_id;

    END IF;
END //

DELIMITER ;



-- ==================================================
-- Migration File: 19_sync_appointment_payment_status.sql
-- ==================================================

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



-- ==================================================
-- Migration File: 20_sync_rental_payment_status.sql
-- ==================================================

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



-- ==================================================
-- Migration File: 21_make_database_self_contained.sql
-- ==================================================

-- =============================================================================
-- Migration 21: Make database payment status synchronization self-contained
-- Creado: 2026-06-26
-- =============================================================================

DELIMITER //

-- 1. Redefine trg_audit_transaction_insert to also handle automatic payment status sync
CREATE OR REPLACE TRIGGER trg_audit_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    -- Audit log
    INSERT INTO transaction_audits (transaction_id, action, new_amount, new_status, changed_at)
    VALUES (NEW.id, 'INSERT', NEW.amount, NEW.status, NOW());

    -- Payment status synchronization
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
END //

-- 2. Redefine trg_audit_transaction_update to also handle automatic payment status sync
CREATE OR REPLACE TRIGGER trg_audit_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    -- Audit log
    IF OLD.amount != NEW.amount OR OLD.status != NEW.status THEN
        INSERT INTO transaction_audits (transaction_id, action, old_amount, new_amount, old_status, new_status, changed_at)
        VALUES (NEW.id, 'UPDATE', OLD.amount, NEW.amount, OLD.status, NEW.status, NOW());
    END IF;

    -- Payment status synchronization for appointment_id
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF OLD.appointment_id IS NOT NULL AND (NEW.appointment_id IS NULL OR OLD.appointment_id != NEW.appointment_id) THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;

    -- Payment status synchronization for rental_id
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF OLD.rental_id IS NOT NULL AND (NEW.rental_id IS NULL OR OLD.rental_id != NEW.rental_id) THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;

    -- Payment status synchronization for request_id
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
    IF OLD.request_id IS NOT NULL AND (NEW.request_id IS NULL OR OLD.request_id != NEW.request_id) THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END //

-- 3. Redefine trg_audit_transaction_delete to also handle automatic payment status sync
CREATE OR REPLACE TRIGGER trg_audit_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    -- Audit log
    INSERT INTO transaction_audits (transaction_id, action, old_amount, old_status, changed_at)
    VALUES (OLD.id, 'DELETE', OLD.amount, OLD.status, NOW());

    -- Payment status synchronization
    IF OLD.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;
    IF OLD.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;
    IF OLD.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END //

DELIMITER ;



-- ==================================================
-- Migration File: 22_sync_schedule_payment_columns.sql
-- ==================================================

-- =============================================================================
-- Migration 22: Update sp_get_daily_schedule to select payment columns
-- Creado: 2026-06-26
-- =============================================================================

DELIMITER //

CREATE OR REPLACE PROCEDURE sp_get_daily_schedule(
    IN p_doctor_id INT,
    IN p_date_str VARCHAR(10)
)
BEGIN
    DECLARE v_duration INT;
    DECLARE v_overturn_start TIME;
    DECLARE v_overturn_end TIME;
    DECLARE v_force_alignment TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_slot_dur INT;
    DECLARE v_date DATE;
    DECLARE v_day_of_week INT;
    DECLARE v_is_holiday TINYINT DEFAULT 0;

    -- Temp table to store generated slots
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_slots;

    SET v_date = STR_TO_DATE(p_date_str, '%Y-%m-%d');
    SET v_day_of_week = DAYOFWEEK(v_date) - 1;

    -- Check if it is a holiday
    SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_date;

    -- Get doctor configuration
    SELECT 
        COALESCE(appointment_duration, 60), 
        COALESCE(overturn_start_time, '08:00:00'), 
        COALESCE(overturn_end_time, '21:00:00'),
        COALESCE(force_hour_alignment, 0)
    INTO 
        v_duration, 
        v_overturn_start, 
        v_overturn_end,
        v_force_alignment
    FROM doctors 
    WHERE id = p_doctor_id;

    SET v_current_time = v_overturn_start;

    -- Loop to generate time slots
    WHILE v_current_time < v_overturn_end DO
        SET v_slot_dur = v_duration;
        
        IF v_force_alignment = 1 AND (TIME_TO_SEC(v_current_time) % 3600) != 0 THEN
            SET v_slot_dur = 60 - ((TIME_TO_SEC(v_current_time) % 3600) / 60);
        END IF;

        IF TIME_TO_SEC(v_current_time) + (v_slot_dur * 60) > TIME_TO_SEC(v_overturn_end) THEN
            SET v_current_time = v_overturn_end;
        ELSE
            BEGIN
                DECLARE v_is_official TINYINT DEFAULT 0;
                DECLARE v_is_break TINYINT DEFAULT 0;
                DECLARE v_status VARCHAR(50);

                IF v_is_holiday = 1 THEN
                    SET v_status = 'closed_holiday';
                ELSE
                    -- Check if falls in official work schedules
                    SELECT COUNT(*) INTO v_is_official
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 0
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    -- Check if falls in break
                    SELECT COUNT(*) INTO v_is_break
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 1
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    IF v_is_break > 0 THEN
                        SET v_status = 'break';
                    ELSEIF v_is_official > 0 THEN
                        SET v_status = 'free';
                    ELSE
                        SET v_status = 'out_of_hours';
                    END IF;
                END IF;

                INSERT INTO temp_slots (slot_date, slot_time, slot_status, is_out_of_hours)
                VALUES (v_date, v_current_time, v_status, CASE WHEN v_status = 'out_of_hours' THEN 1 ELSE 0 END);
            END;

            SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_dur * 60));
        END IF;
    END WHILE;

    -- Select slot details joined with appointments including payment columns
    SELECT 
        a.id,
        a.appointment_date,
        p_doctor_id as doctor_id,
        d.full_name as doctor_name,
        a.patient_id,
        a.patient_name,
        a.patient_phone,
        a.status,
        a.reason,
        a.type,
        ts.is_out_of_hours,
        a.paid_amount,
        a.pending_amount,
        a.cost,
        a.payment_status,
        a.rescheduled_from_date,
        ts.slot_date,
        ts.slot_time,
        CASE 
            WHEN a.id IS NOT NULL THEN 'taken' 
            ELSE ts.slot_status 
        END as slot_status
    FROM temp_slots ts
    LEFT JOIN v_appointment_details a 
        ON a.doctor_id = p_doctor_id 
        AND DATE(a.appointment_date) = ts.slot_date 
        AND TIME(a.appointment_date) = ts.slot_time
        AND a.status NOT IN ('cancelled', 'suspended')
    LEFT JOIN doctors d ON d.id = p_doctor_id
    ORDER BY ts.slot_time;
END //

DELIMITER ;



-- ==================================================
-- Migration File: 23_fix_appointment_cost_and_sync_logic.sql
-- ==================================================

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


