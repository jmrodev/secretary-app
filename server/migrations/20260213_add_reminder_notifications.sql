-- Migration: Add notified status fields for reminders
ALTER TABLE patient_medications ADD COLUMN is_notified TINYINT(1) DEFAULT 0;
ALTER TABLE patients ADD COLUMN visit_notified TINYINT(1) DEFAULT 0;
ALTER TABLE patients ADD COLUMN prescription_notified TINYINT(1) DEFAULT 0;
ALTER TABLE patients ADD COLUMN license_notified TINYINT(1) DEFAULT 0;
