
-- Optimization Migration: Create Extended Patient View
-- This view aggregates financial and attendance stats to avoid multiple subqueries from the backend.

CREATE OR REPLACE VIEW view_patients_extended AS
SELECT 
    p.*,
    u.username,
    u.role,
    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments,
    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.status = 'completed') as attended_appointments,
    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.status = 'absent') as missed_appointments,
    (SELECT IFNULL(SUM(cost), 0) FROM appointments a WHERE a.patient_id = p.id AND a.payment_status IN ('debt', 'pending')) +
    (SELECT IFNULL(SUM(debt_amount), 0) FROM medical_requests mr WHERE mr.patient_id = p.id AND mr.payment_status IN ('debt', 'pending')) as total_debt_calculated,
    (SELECT MAX(appointment_date) FROM appointments a WHERE a.patient_id = p.id AND a.status = 'completed') as last_visit
FROM patients p
JOIN users u ON p.user_id = u.id;
