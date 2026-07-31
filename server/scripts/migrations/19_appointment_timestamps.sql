-- =============================================================================
-- Migration 19: Appointment Timestamps, Traceability and Extended Description
-- Adds timestamp columns for full appointment status lifecycle
-- =============================================================================

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS confirmed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS arrived_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS paid_at DATETIME NULL;

ALTER TABLE transactions MODIFY COLUMN description TEXT NULL;

DELIMITER //

CREATE OR REPLACE PROCEDURE sp_create_transaction(
    IN  p_type             VARCHAR(50),
    IN  p_amount           DECIMAL(10,2),
    IN  p_method           VARCHAR(50),
    IN  p_description      TEXT,
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
    DECLARE v_payment_status VARCHAR(50);
    DECLARE v_already_paid DECIMAL(10,2) DEFAULT 0;
    DECLARE v_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE v_remaining DECIMAL(10,2) DEFAULT 0;

    -- Validar a nivel de base de datos el límite del pago para turnos
    IF p_appointment_id IS NOT NULL AND (p_is_withdrawal IS NULL OR p_is_withdrawal = 0) AND (p_status = 'paid' OR p_status IS NULL) THEN
        SELECT payment_status, cost INTO v_payment_status, v_cost FROM appointments WHERE id = p_appointment_id;
        
        SELECT COALESCE(SUM(amount), 0) INTO v_already_paid 
        FROM transactions 
        WHERE appointment_id = p_appointment_id AND status = 'paid' AND is_withdrawal = 0;

        IF v_cost > 0 THEN
            SET v_remaining = v_cost - v_already_paid;
            IF v_remaining <= 0 OR v_payment_status = 'paid' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El turno ya se encuentra cancelado totalmente.';
            ELSEIF p_amount > (v_remaining + 0.01) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El monto del pago supera el saldo pendiente del turno.';
            END IF;
        END IF;
    END IF;

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

-- ---------------------------------------------------------------------------
-- Update View v_appointment_details to include timestamps
-- ---------------------------------------------------------------------------
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
    a.created_at,
    a.confirmed_at,
    a.arrived_at,
    a.completed_at,
    a.paid_at,
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
    -- Patient metrics
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
