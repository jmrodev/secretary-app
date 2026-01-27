-- Create recently_freed_slots table for optimizing availability search
CREATE TABLE IF NOT EXISTS `recently_freed_slots` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `doctor_id` int(11) NOT NULL,
    `slot_date` datetime NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_doctor_date` (`doctor_id`, `slot_date`),
    CONSTRAINT `fk_freed_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create overwritten_reservations table to track when a reservation is bumped
CREATE TABLE IF NOT EXISTS `overwritten_reservations` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `doctor_id` int(11) NOT NULL,
    `patient_id` int(11) NOT NULL,
    `patient_name` varchar(255) DEFAULT NULL,
    `slot_date` datetime NOT NULL,
    `overwritten_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `doctor_id` (`doctor_id`),
    CONSTRAINT `fk_over_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
