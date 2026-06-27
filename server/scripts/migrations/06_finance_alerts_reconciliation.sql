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
