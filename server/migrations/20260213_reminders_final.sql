-- Migration: Medication Modes and Notifications
-- This ensures all fields required for the new dashboard reminders and medication modes exist.

-- 1. Add notification flags to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS visit_notified TINYINT(1) DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS prescription_notified TINYINT(1) DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS license_notified TINYINT(1) DEFAULT 0;

-- 2. Add notification flag to medication items
ALTER TABLE patient_medications ADD COLUMN IF NOT EXISTS is_notified TINYINT(1) DEFAULT 0;

-- 3. Add medication refill mode fields
ALTER TABLE patient_medications ADD COLUMN IF NOT EXISTS reminder_mode ENUM('calculation','fixed_day','fixed_date') DEFAULT 'calculation';
ALTER TABLE patient_medications ADD COLUMN IF NOT EXISTS reminder_day INT DEFAULT NULL;
ALTER TABLE patient_medications ADD COLUMN IF NOT EXISTS units_per_box INT DEFAULT NULL;
ALTER TABLE patient_medications ADD COLUMN IF NOT EXISTS daily_intake DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE patient_medications ADD COLUMN IF NOT EXISTS boxes_count INT DEFAULT NULL;

-- 4. Global setting for medication refill template
INSERT IGNORE INTO system_settings (setting_key, setting_value) 
VALUES ('medication_refill_reminder_template', 'Hola {patient_name}, te recordamos que según nuestros registros tu medicación ({medication_name}) está próxima a terminarse. ¿Necesitas que te preparemos la receta? Atte: {secretary_name}');
