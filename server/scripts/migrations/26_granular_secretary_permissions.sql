-- Migration: Add granular secretary permissions matrix
-- Step 1: Add columns if they do not exist
ALTER TABLE `users`
  ADD COLUMN `can_crud_appointments` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `can_edit_past_appointments` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `can_crud_requests` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `can_crud_prescriptions` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `can_crud_licenses` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `can_crud_files` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `can_crud_finances` TINYINT(1) NOT NULL DEFAULT 0;

-- Step 2: Populate existing secretaries from system_settings and bump token_version for session eviction
UPDATE users u
CROSS JOIN (
  SELECT 
    MAX(CASE WHEN setting_key = 'enable_secretary_crud_appointments' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_appointments,
    MAX(CASE WHEN setting_key = 'allow_secretary_edit_past_appointments' THEN setting_value = 'true' OR setting_value = '1' END) AS can_edit_past_appointments,
    MAX(CASE WHEN setting_key = 'enable_secretary_crud_requests' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_requests,
    MAX(CASE WHEN setting_key = 'enable_secretary_crud_prescriptions' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_prescriptions,
    MAX(CASE WHEN setting_key = 'enable_secretary_crud_licenses' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_licenses,
    MAX(CASE WHEN setting_key = 'enable_secretary_crud_files' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_files,
    MAX(CASE WHEN setting_key = 'enable_secretary_finance_crud' THEN setting_value = 'true' OR setting_value = '1' END) AS can_crud_finances
  FROM system_settings
) s
SET 
  u.can_crud_appointments = COALESCE(s.can_crud_appointments, 0),
  u.can_edit_past_appointments = COALESCE(s.can_edit_past_appointments, 0),
  u.can_crud_requests = COALESCE(s.can_crud_requests, 0),
  u.can_crud_prescriptions = COALESCE(s.can_crud_prescriptions, 0),
  u.can_crud_licenses = COALESCE(s.can_crud_licenses, 0),
  u.can_crud_files = COALESCE(s.can_crud_files, 0),
  u.can_crud_finances = COALESCE(s.can_crud_finances, 0),
  u.token_version = u.token_version + 1
WHERE u.role = 'secretary';
