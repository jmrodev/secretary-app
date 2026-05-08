
-- Optimization Migration: Create Extended Patient View (V2)
-- This view aggregates financial and attendance stats to avoid multiple subqueries from the backend.
-- It implements the rating logic (1-5) for financial behavior and attendance.

CREATE OR REPLACE VIEW view_patients_extended AS
SELECT 
    p.*,
    u.username,
    u.role,
    
    -- Total Appointments Stats
    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments,
    
    (SELECT COUNT(*) FROM appointments a 
     WHERE a.patient_id = p.id AND a.status IN ('attended', 'completed')) as attended_appointments,
     
    (SELECT COUNT(*) FROM appointments a 
     WHERE a.patient_id = p.id AND (a.status = 'absent' OR (a.status = 'cancelled' AND COALESCE(a.cancellation_reason, '') NOT LIKE '%error%'))) as missed_appointments,

    -- Source of Truth Debt (from transactions table)
    (SELECT COALESCE(SUM(t.amount), 0) 
     FROM transactions t 
     LEFT JOIN appointments a ON t.appointment_id = a.id 
     WHERE t.related_user_id = p.user_id 
     AND t.status = 'pending' 
     AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
    ) as total_debt_calculated,

    -- Financial Rating (1-5)
    (SELECT CASE 
        WHEN COALESCE(SUM(t.amount), 0) <= 0 THEN 5
        WHEN SUM(t.amount) < 1000 THEN 4
        WHEN SUM(t.amount) < 5000 THEN 3
        WHEN SUM(t.amount) < 10000 THEN 2
        ELSE 1 
     END
     FROM transactions t 
     LEFT JOIN appointments a ON t.appointment_id = a.id 
     WHERE t.related_user_id = p.user_id 
     AND t.status = 'pending' 
     AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
    ) as financial_rating,

    -- Attendance Rating (1-5)
    (SELECT CASE 
        WHEN COUNT(*) = 0 THEN 5
        WHEN (COUNT(*) - COUNT(CASE WHEN (a.status = 'absent' OR (a.status = 'cancelled' AND COALESCE(a.cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END)) / COUNT(*) >= 0.95 THEN 5
        WHEN (COUNT(*) - COUNT(CASE WHEN (a.status = 'absent' OR (a.status = 'cancelled' AND COALESCE(a.cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END)) / COUNT(*) >= 0.85 THEN 4
        WHEN (COUNT(*) - COUNT(CASE WHEN (a.status = 'absent' OR (a.status = 'cancelled' AND COALESCE(a.cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END)) / COUNT(*) >= 0.70 THEN 3
        WHEN (COUNT(*) - COUNT(CASE WHEN (a.status = 'absent' OR (a.status = 'cancelled' AND COALESCE(a.cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END)) / COUNT(*) >= 0.50 THEN 2
        ELSE 1 
     END
     FROM appointments a WHERE a.patient_id = p.id
    ) as attendance_rating,

    (SELECT MAX(appointment_date) FROM appointments a WHERE a.patient_id = p.id AND a.status IN ('attended', 'completed')) as last_visit

FROM patients p
JOIN users u ON p.user_id = u.id;
