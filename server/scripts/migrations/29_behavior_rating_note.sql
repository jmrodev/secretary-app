-- Migration 29: Add behavior_rating_note to patients table and update view_patients_extended

ALTER TABLE `patients`
ADD COLUMN IF NOT EXISTS `behavior_rating_note` TEXT DEFAULT NULL AFTER `behavior_rating`;

CREATE OR REPLACE VIEW `view_patients_extended` AS
SELECT 
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`first_name` AS `first_name`,
    `p`.`last_name` AS `last_name`,
    `p`.`full_name` AS `full_name`,
    `p`.`dob` AS `dob`,
    `p`.`phone` AS `phone`,
    `p`.`email` AS `email`,
    `p`.`medical_history` AS `medical_history`,
    `p`.`dni` AS `dni`,
    `p`.`affiliate_number` AS `affiliate_number`,
    `p`.`insurance_id` AS `insurance_id`,
    `p`.`tariff_percent` AS `tariff_percent`,
    `p`.`tariff_override` AS `tariff_override`,
    CASE 
        WHEN `p`.`behavior_rating_note` IS NOT NULL AND TRIM(`p`.`behavior_rating_note`) != '' AND `p`.`behavior_rating` IS NOT NULL THEN `p`.`behavior_rating`
        ELSE ROUND((
            (CASE 
                WHEN COALESCE(`b`.`total_debt_calculated`, 0) <= 0 THEN 5 
                WHEN `b`.`total_debt_calculated` < 1000 THEN 4 
                WHEN `b`.`total_debt_calculated` < 5000 THEN 3 
                WHEN `b`.`total_debt_calculated` < 10000 THEN 2 
                ELSE 1 
            END) +
            (CASE 
                WHEN COALESCE(`appt_stats`.`total_appointments`, 0) = 0 THEN 5
                WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.95 THEN 5
                WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.85 THEN 4
                WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.70 THEN 3
                WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.50 THEN 2
                ELSE 1 
            END)
        ) / 2)
    END AS `behavior_rating`,
    `p`.`behavior_rating_note` AS `behavior_rating_note`,
    `p`.`is_new_patient` AS `is_new_patient`,
    `p`.`marked_new_at` AS `marked_new_at`,
    `p`.`visit_interval_days` AS `visit_interval_days`,
    `p`.`prescription_interval_days` AS `prescription_interval_days`,
    `p`.`next_suggested_visit_date` AS `next_suggested_visit_date`,
    `p`.`next_suggested_prescription_date` AS `next_suggested_prescription_date`,
    `p`.`license_expiry_date` AS `license_expiry_date`,
    `p`.`institution_id` AS `institution_id`,
    `p`.`street_name` AS `street_name`,
    `p`.`street_number` AS `street_number`,
    `p`.`floor` AS `floor`,
    `p`.`apartment` AS `apartment`,
    `p`.`city` AS `city`,
    `p`.`province` AS `province`,
    `p`.`country` AS `country`,
    `p`.`visit_notified` AS `visit_notified`,
    `p`.`prescription_notified` AS `prescription_notified`,
    `p`.`license_notified` AS `license_notified`,
    `u`.`username` AS `username`,
    `u`.`role` AS `role`,
    COALESCE(`appt_stats`.`total_appointments`, 0) AS `total_appointments`,
    COALESCE(`appt_stats`.`attended_appointments`, 0) AS `attended_appointments`,
    COALESCE(`appt_stats`.`missed_appointments`, 0) AS `missed_appointments`,
    `appt_stats`.`last_visit` AS `last_visit`,
    COALESCE(`b`.`total_debt_calculated`, 0) AS `total_debt_calculated`,
    COALESCE(`b`.`debt_status`, 'green') AS `debt_status`,
    `b`.`oldest_debt_days` AS `oldest_debt_days`,
    CASE 
        WHEN COALESCE(`b`.`total_debt_calculated`, 0) <= 0 THEN 5 
        WHEN `b`.`total_debt_calculated` < 1000 THEN 4 
        WHEN `b`.`total_debt_calculated` < 5000 THEN 3 
        WHEN `b`.`total_debt_calculated` < 10000 THEN 2 
        ELSE 1 
    END AS `financial_rating`,
    CASE 
        WHEN COALESCE(`appt_stats`.`total_appointments`, 0) = 0 THEN 5
        WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.95 THEN 5
        WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.85 THEN 4
        WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.70 THEN 3
        WHEN (`appt_stats`.`total_appointments` - `appt_stats`.`missed_appointments`) / `appt_stats`.`total_appointments` >= 0.50 THEN 2
        ELSE 1 
    END AS `attendance_rating`
FROM (((`patients` `p` 
JOIN `users` `u` ON (`p`.`user_id` = `u`.`id`)) 
LEFT JOIN `view_patient_balances` `b` ON (`p`.`id` = `b`.`patient_id`)) 
LEFT JOIN (
    SELECT 
        `appointments`.`patient_id` AS `patient_id`,
        COUNT(0) AS `total_appointments`,
        COUNT(CASE WHEN `appointments`.`status` IN ('attended', 'completed', 'arrived') THEN 1 END) AS `attended_appointments`,
        COUNT(CASE WHEN `appointments`.`status` = 'absent' OR (`appointments`.`status` = 'cancelled' AND COALESCE(`appointments`.`cancellation_reason`, '') NOT LIKE '%error%') THEN 1 END) AS `missed_appointments`,
        MAX(`appointments`.`appointment_date`) AS `last_visit` 
    FROM `appointments` 
    GROUP BY `appointments`.`patient_id`
) `appt_stats` ON (`appt_stats`.`patient_id` = `p`.`id`));
