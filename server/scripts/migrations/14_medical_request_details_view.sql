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
