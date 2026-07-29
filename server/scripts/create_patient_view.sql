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
