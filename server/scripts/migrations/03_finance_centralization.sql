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
