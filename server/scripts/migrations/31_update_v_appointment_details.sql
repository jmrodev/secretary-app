-- Migration 31: Update v_appointment_details to project effective cost, paid_amount, pending_amount, cancellation_reason and payment_method
-- Properly segregates patient financial obligations from institution/health insurance debts.

DROP VIEW IF EXISTS `v_appointment_details`;

CREATE OR REPLACE VIEW `v_appointment_details` AS 
SELECT 
    `a`.`id` AS `id`,
    `a`.`appointment_date` AS `appointment_date`,
    `a`.`reason` AS `reason`,
    `a`.`cancellation_reason` AS `cancellation_reason`,
    `a`.`status` AS `status`,
    `a`.`payment_status` AS `payment_status`,
    CASE 
        WHEN `a`.`bonified` = 1 THEN 1
        WHEN COALESCE(`tx`.`pending_amount`, 0) > 0 THEN 0
        WHEN `a`.`institution_id` IS NOT NULL AND (COALESCE(`tx`.`paid_amount`, 0) + COALESCE(`tx`.`pending_amount`, 0)) = 0 THEN 1
        ELSE `a`.`is_paid`
    END AS `is_paid`,
    `a`.`type` AS `type`,
    `a`.`is_out_of_hours` AS `is_out_of_hours`,
    `a`.`bonified` AS `bonified`,
    CASE 
        WHEN `a`.`bonified` = 1 THEN 0.00
        WHEN `a`.`institution_id` IS NOT NULL THEN
            COALESCE(`tx`.`paid_amount`, 0) + COALESCE(`tx`.`pending_amount`, 0)
        ELSE
            GREATEST(
                COALESCE(`a`.`cost`, 0),
                COALESCE(`tx`.`paid_amount`, 0) + COALESCE(`tx`.`pending_amount`, 0)
            )
    END AS `cost`,
    GREATEST(
        COALESCE(`a`.`cost`, 0),
        COALESCE(`tx`.`paid_amount`, 0) + COALESCE(`tx`.`pending_amount`, 0) + COALESCE(`tx`.`institution_paid_amount`, 0) + COALESCE(`tx`.`institution_pending_amount`, 0),
        COALESCE(`inst`.`base_price`, 0)
    ) AS `total_cost`,
    `a`.`google_event_id` AS `google_event_id`,
    `a`.`rescheduled_from_date` AS `rescheduled_from_date`,
    `a`.`duration` AS `duration`,
    `a`.`created_at` AS `created_at`,
    `a`.`confirmed_at` AS `confirmed_at`,
    `a`.`arrived_at` AS `arrived_at`,
    `a`.`completed_at` AS `completed_at`,
    `a`.`paid_at` AS `paid_at`,
    `a`.`patient_id` AS `patient_id`,
    `p`.`full_name` AS `patient_name`,
    `p`.`dni` AS `patient_dni`,
    `p`.`phone` AS `patient_phone`,
    `p`.`behavior_rating` AS `behavior_rating`,
    `a`.`doctor_id` AS `doctor_id`,
    `d`.`full_name` AS `doctor_name`,
    `d`.`afip_cuit` AS `doctor_cuit`,
    `a`.`institution_id` AS `institution_id`,
    `inst`.`name` AS `institution_name`,
    COALESCE(`inst`.`base_price`, 0) AS `institution_base_price`,
    COALESCE(`tx`.`paid_amount`, 0) AS `paid_amount`,
    COALESCE(`tx`.`pending_amount`, 0) AS `pending_amount`,
    COALESCE(`tx`.`institution_paid_amount`, 0) AS `institution_paid_amount`,
    COALESCE(`tx`.`institution_pending_amount`, 0) AS `institution_pending_amount`,
    `tx`.`payment_method` AS `payment_method`,
    `inv`.`invoice_number` AS `invoice_number`,
    `inv`.`invoice_punto_vta` AS `invoice_punto_vta`,
    `inv`.`invoice_cae` AS `invoice_cae`,
    (SELECT COUNT(0) FROM `appointments` `a2` WHERE `a2`.`patient_id` = `a`.`patient_id` AND `a2`.`status` IN ('attended', 'completed')) AS `attended_appointments`
FROM `appointments` `a`
LEFT JOIN `patients` `p` ON `a`.`patient_id` = `p`.`id`
JOIN `doctors` `d` ON `a`.`doctor_id` = `d`.`id`
LEFT JOIN `institutions` `inst` ON `a`.`institution_id` = `inst`.`id`
LEFT JOIN (
    SELECT 
        `transactions`.`appointment_id` AS `appointment_id`,
        SUM(CASE WHEN `transactions`.`status` = 'paid' AND `transactions`.`institution_id` IS NULL THEN `transactions`.`amount` ELSE 0 END) AS `paid_amount`,
        SUM(CASE WHEN `transactions`.`status` = 'pending' AND `transactions`.`institution_id` IS NULL THEN `transactions`.`amount` ELSE 0 END) AS `pending_amount`,
        SUM(CASE WHEN `transactions`.`status` = 'paid' AND `transactions`.`institution_id` IS NOT NULL THEN `transactions`.`amount` ELSE 0 END) AS `institution_paid_amount`,
        SUM(CASE WHEN `transactions`.`status` = 'pending' AND `transactions`.`institution_id` IS NOT NULL THEN `transactions`.`amount` ELSE 0 END) AS `institution_pending_amount`,
        MAX(CASE WHEN `transactions`.`institution_id` IS NULL THEN `transactions`.`method` ELSE NULL END) AS `payment_method`
    FROM `transactions` 
    WHERE `transactions`.`is_withdrawal` = 0 
    GROUP BY `transactions`.`appointment_id`
) `tx` ON `tx`.`appointment_id` = `a`.`id`
LEFT JOIN (
    SELECT 
        `t`.`appointment_id` AS `appointment_id`,
        MIN(`i`.`cbte_nro`) AS `invoice_number`,
        MIN(`i`.`punto_vta`) AS `invoice_punto_vta`,
        MIN(`i`.`cae`) AS `invoice_cae`
    FROM `invoices` `i` 
    JOIN `transactions` `t` ON `i`.`transaction_id` = `t`.`id`
    WHERE `t`.`appointment_id` IS NOT NULL 
    GROUP BY `t`.`appointment_id`
) `inv` ON `inv`.`appointment_id` = `a`.`id`;
