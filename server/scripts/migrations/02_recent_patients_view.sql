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
