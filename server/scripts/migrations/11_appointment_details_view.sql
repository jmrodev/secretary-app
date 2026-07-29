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
