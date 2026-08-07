/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `active_holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `active_holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) NOT NULL,
  `consultorio_id` int(11) DEFAULT NULL,
  `appointment_date` datetime NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled','suspended','absent','rescheduled','arrived','reserved') DEFAULT 'pending',
  `cancellation_reason` text DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT 0.00,
  `is_paid` tinyint(1) DEFAULT 0,
  `payment_status` enum('pending','paid','debt','partial') DEFAULT 'pending',
  `google_event_id` varchar(255) DEFAULT NULL,
  `is_out_of_hours` tinyint(1) DEFAULT 0,
  `type` enum('consultation','virtual') DEFAULT 'consultation',
  `institution_id` int(11) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `bonified` tinyint(1) DEFAULT 0,
  `rescheduled_from_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `confirmed_at` datetime DEFAULT NULL,
  `arrived_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `consultorio_id` (`consultorio_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`consultorio_id`) REFERENCES `consultorios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cash_box_balancings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_box_balancings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) DEFAULT NULL,
  `balancing_date` date NOT NULL,
  `theoretical_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `physical_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `difference` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cb_doctor` (`doctor_id`),
  KEY `idx_cb_date` (`balancing_date`),
  CONSTRAINT `fk_cb_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `consultorios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultorios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('available','occupied','maintenance') DEFAULT 'available',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deleted_appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deleted_appointments` (
  `id` int(11) NOT NULL DEFAULT 0,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) NOT NULL,
  `consultorio_id` int(11) DEFAULT NULL,
  `appointment_date` datetime NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled','suspended','absent','rescheduled','reserved') DEFAULT 'pending',
  `cancellation_reason` text DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT 0.00,
  `is_paid` tinyint(1) DEFAULT 0,
  `payment_status` enum('pending','paid','debt','partial') DEFAULT 'pending',
  `google_event_id` varchar(255) DEFAULT NULL,
  `is_out_of_hours` tinyint(1) DEFAULT 0,
  `type` enum('consultation','virtual') DEFAULT 'consultation',
  `deleted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `bonified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `doctor_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_integrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `access_token` text NOT NULL,
  `refresh_token` text NOT NULL,
  `account_email` varchar(255) DEFAULT NULL,
  `token_expiry` bigint(20) NOT NULL,
  `calendar_id` varchar(255) DEFAULT 'primary',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `spreadsheet_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_doctor` (`doctor_id`),
  CONSTRAINT `doctor_integrations_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `doctor_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `day_of_week` int(11) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_break` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `default_type` enum('consultation','virtual') DEFAULT 'consultation',
  `force_hour_alignment` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `doctor_schedules_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=374 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `specialty` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `cbu` varchar(50) DEFAULT NULL,
  `alias` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `dni` varchar(50) DEFAULT NULL,
  `consultation_price` decimal(10,2) DEFAULT 0.00,
  `office_number` varchar(50) DEFAULT NULL,
  `rental_type` enum('hourly','daily','weekly','monthly') DEFAULT 'monthly',
  `rental_cost` decimal(10,2) DEFAULT 0.00,
  `prescription_price` decimal(10,2) DEFAULT 0.00,
  `medical_license_price` decimal(10,2) DEFAULT 0.00,
  `certificate_price` decimal(10,2) DEFAULT 0.00,
  `virtual_consultation_price` decimal(10,2) DEFAULT 0.00,
  `default_visit_interval_days` int(11) DEFAULT 0,
  `default_prescription_interval_days` int(11) DEFAULT 0,
  `appointment_duration` int(11) DEFAULT 60,
  `break_duration` int(11) DEFAULT 0,
  `overturn_start_time` time DEFAULT '08:00:00',
  `overturn_end_time` time DEFAULT '21:00:00',
  `force_hour_alignment` tinyint(1) DEFAULT 0,
  `afip_cuit` varchar(20) DEFAULT NULL,
  `afip_cert_path` varchar(255) DEFAULT NULL,
  `afip_key_path` varchar(255) DEFAULT NULL,
  `afip_enabled` tinyint(1) DEFAULT 0,
  `afip_pto_vta` int(11) DEFAULT 1,
  `reminder_template` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmation_template` text DEFAULT NULL,
  `reminder_virtual_template` text DEFAULT NULL,
  `confirmation_virtual_template` text DEFAULT NULL,
  `gemini_context` text DEFAULT NULL,
  `gemini_model` varchar(100) DEFAULT NULL,
  `gemini_history_limit` int(11) DEFAULT 3,
  `gemini_api_version` varchar(20) DEFAULT 'v1beta',
  `pending_response_template` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `google_sync_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `google_sync_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `action` enum('create','update','delete') NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `status` enum('pending','failed') DEFAULT 'pending',
  `retries` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_error` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `institutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `institutions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `base_price` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `insurances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `cuit` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address_notes` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `street_name` varchar(255) DEFAULT NULL,
  `street_number` varchar(50) DEFAULT NULL,
  `floor` varchar(50) DEFAULT NULL,
  `apartment` varchar(50) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) DEFAULT NULL,
  `cbte_tipo` int(11) NOT NULL,
  `punto_vta` int(11) NOT NULL,
  `cbte_nro` bigint(20) NOT NULL,
  `cae` varchar(20) DEFAULT NULL,
  `cae_vto` date DEFAULT NULL,
  `imp_total` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `medical_licenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_licenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `days_duration` int(11) NOT NULL,
  `diagnosis` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `payment_status` enum('pending','paid','debt') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `medical_licenses_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `medical_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_request_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `medication_name` varchar(255) NOT NULL,
  `dose` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected','modified') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `vademecum_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `fk_mri_vademecum` (`vademecum_id`),
  CONSTRAINT `fk_mri_vademecum` FOREIGN KEY (`vademecum_id`) REFERENCES `vademecum` (`id`) ON DELETE SET NULL,
  CONSTRAINT `medical_request_items_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `medical_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `medical_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('prescription','license','certificate') NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `secretary_id` int(11) DEFAULT NULL,
  `status` enum('pending','completed','rejected') DEFAULT 'pending',
  `request_note` text DEFAULT NULL,
  `doctor_note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_status` enum('pending','paid','debt','partial','bonified') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT 'cash',
  `debt_amount` decimal(10,2) DEFAULT 0.00,
  `completed_at` timestamp NULL DEFAULT NULL,
  `raw_medication_data` text DEFAULT NULL,
  `is_patient_submitted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `secretary_id` (`secretary_id`),
  CONSTRAINT `medical_requests_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `medical_requests_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `medical_requests_ibfk_3` FOREIGN KEY (`secretary_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `recipient_id` int(11) DEFAULT NULL,
  `recipient_type` enum('individual','all_staff','all_patients') DEFAULT 'individual',
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `read_status` tinyint(4) DEFAULT 0 COMMENT '0: Sent, 1: Delivered, 2: Read',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_recipient` (`recipient_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_type` (`recipient_type`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `office_rentals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `office_rentals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `consultorio_id` int(11) NOT NULL,
  `rental_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `is_paid` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `consultorio_id` (`consultorio_id`),
  CONSTRAINT `office_rentals_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `office_rentals_ibfk_2` FOREIGN KEY (`consultorio_id`) REFERENCES `consultorios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_office_rental_insert
AFTER INSERT ON office_rentals
FOR EACH ROW
BEGIN
    INSERT INTO transactions (
        type,
        amount,
        description,
        doctor_id,
        status,
        method,
        is_withdrawal,
        related_user_id,
        transaction_date,
        rental_id
    ) VALUES (
        'income_rental',
        NEW.cost,
        CONCAT('Alquiler de Consultorio (Reserva): ', NEW.rental_date),
        NEW.doctor_id,
        CASE WHEN NEW.cost = 0 THEN 'paid' ELSE 'pending' END,
        CASE WHEN NEW.cost = 0 THEN 'bonified' ELSE 'on_account' END,
        0,
        (SELECT user_id FROM doctors WHERE id = NEW.doctor_id),
        NOW(),
        NEW.id
    );
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `overwritten_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `overwritten_reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `slot_date` datetime NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `patient_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `overwritten_reservations_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `overwritten_reservations_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_access_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `patient_access_tokens_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_doctors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assignment` (`patient_id`,`doctor_id`),
  KEY `fk_pd_doctor` (`doctor_id`),
  CONSTRAINT `fk_pd_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pd_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `patient_files_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `patient_files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_medications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `medication_name` varchar(255) NOT NULL,
  `presentation` varchar(255) DEFAULT NULL,
  `monodroga` varchar(255) DEFAULT NULL,
  `dose` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `is_chronic` tinyint(1) DEFAULT 0,
  `status` enum('active','discontinued') DEFAULT 'active',
  `added_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `next_refill_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_notified` tinyint(1) DEFAULT 0,
  `vademecum_id` int(11) DEFAULT NULL,
  `reminder_mode` enum('calculation','fixed_day','fixed_date') DEFAULT 'calculation',
  `reminder_day` int(11) DEFAULT NULL,
  `units_per_box` int(11) DEFAULT NULL,
  `daily_intake` decimal(10,2) DEFAULT NULL,
  `boxes_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pm_patient` (`patient_id`),
  KEY `fk_pm_added_by` (`added_by`),
  KEY `fk_pm_vademecum` (`vademecum_id`),
  CONSTRAINT `fk_pm_added_by` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pm_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pm_vademecum` FOREIGN KEY (`vademecum_id`) REFERENCES `vademecum` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `period_type` enum('weekly','monthly','yearly') NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `new_patients_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_period` (`period_type`,`period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `medical_history` text DEFAULT NULL,
  `dni` varchar(20) DEFAULT NULL,
  `affiliate_number` varchar(100) DEFAULT NULL,
  `insurance_id` int(11) DEFAULT NULL,
  `tariff_percent` int(11) DEFAULT 0,
  `tariff_override` decimal(10,2) DEFAULT NULL,
  `behavior_rating` int(11) DEFAULT 5,
  `is_new_patient` tinyint(1) DEFAULT 1,
  `marked_new_at` timestamp NULL DEFAULT current_timestamp(),
  `visit_interval_days` int(11) DEFAULT NULL,
  `prescription_interval_days` int(11) DEFAULT NULL,
  `next_suggested_visit_date` date DEFAULT NULL,
  `next_suggested_prescription_date` date DEFAULT NULL,
  `license_expiry_date` date DEFAULT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `street_name` varchar(255) DEFAULT NULL,
  `street_number` varchar(50) DEFAULT NULL,
  `floor` varchar(50) DEFAULT NULL,
  `apartment` varchar(50) DEFAULT NULL,
  `city` varchar(255) DEFAULT 'Tandil',
  `province` varchar(255) DEFAULT 'Buenos Aires',
  `country` varchar(255) DEFAULT 'Argentina',
  `visit_notified` tinyint(1) DEFAULT 0,
  `prescription_notified` tinyint(1) DEFAULT 0,
  `license_notified` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_patient_insurance` (`insurance_id`),
  KEY `fk_patient_institution` (`institution_id`),
  KEY `idx_patients_full_name` (`full_name`),
  KEY `idx_patients_dni` (`dni`),
  KEY `idx_patients_phone` (`phone`),
  FULLTEXT KEY `ft_idx_patient_search` (`full_name`,`dni`,`phone`),
  FULLTEXT KEY `idx_patients_search` (`full_name`,`dni`,`phone`),
  CONSTRAINT `fk_patient_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_patient_insurance` FOREIGN KEY (`insurance_id`) REFERENCES `insurances` (`id`) ON DELETE SET NULL,
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `phone_numbers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `phone_numbers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('patient','doctor','secretary','insurance','institution') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `phone_number` varchar(50) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `label` varchar(50) DEFAULT 'Celular',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `prescription_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prescription_id` int(11) NOT NULL,
  `vademecum_id` int(11) DEFAULT NULL,
  `medication_name` varchar(255) NOT NULL,
  `presentation` varchar(255) DEFAULT NULL,
  `monodroga` varchar(255) DEFAULT NULL,
  `dose` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `daily_intake` decimal(10,2) DEFAULT NULL,
  `units_per_box` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pi_prescription` (`prescription_id`),
  KEY `fk_pi_vademecum` (`vademecum_id`),
  CONSTRAINT `fk_pi_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pi_vademecum` FOREIGN KEY (`vademecum_id`) REFERENCES `vademecum` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `prescription_request_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_request_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `used` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `patient_id` (`patient_id`),
  KEY `fk_prt_doctor` (`doctor_id`),
  CONSTRAINT `fk_prt_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prt_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `medications` text NOT NULL,
  `instructions` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `payment_status` enum('pending','paid','debt') DEFAULT 'pending',
  `bonified` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `recently_freed_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recently_freed_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `slot_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `fk_freed_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `recycle_bin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recycle_bin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `entity_name` varchar(255) DEFAULT NULL,
  `data` longtext NOT NULL,
  `deleted_by_id` int(11) DEFAULT NULL,
  `deleted_by_name` varchar(100) DEFAULT NULL,
  `deleted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `secretaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `secretaries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dni` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `secretaries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transaction_audits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_audits` (
  `audit_id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) DEFAULT NULL,
  `action` enum('INSERT','UPDATE','DELETE') DEFAULT NULL,
  `old_amount` decimal(15,2) DEFAULT NULL,
  `new_amount` decimal(15,2) DEFAULT NULL,
  `old_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) DEFAULT NULL,
  `changed_by_user_id` int(11) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `transaction_date` timestamp NULL DEFAULT current_timestamp(),
  `related_user_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `method` varchar(50) DEFAULT 'cash',
  `status` varchar(50) DEFAULT 'paid',
  `proof_file` varchar(255) DEFAULT NULL,
  `is_withdrawal` tinyint(1) DEFAULT 0,
  `request_id` int(11) DEFAULT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `rental_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `related_user_id` (`related_user_id`),
  KEY `fk_trans_doctor` (`doctor_id`),
  KEY `request_id` (`request_id`),
  KEY `fk_transactions_appointment` (`appointment_id`),
  KEY `fk_transaction_institution` (`institution_id`),
  KEY `idx_finance_reconcile` (`transaction_date`,`status`,`doctor_id`,`method`),
  KEY `idx_patient_debt` (`related_user_id`,`status`,`amount`),
  KEY `idx_transactions_appointment_status_withdrawal` (`appointment_id`,`status`,`is_withdrawal`),
  KEY `idx_transactions_request_status_amount` (`request_id`,`status`,`amount`),
  KEY `fk_transaction_rental` (`rental_id`),
  CONSTRAINT `fk_trans_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transaction_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`),
  CONSTRAINT `fk_transaction_rental` FOREIGN KEY (`rental_id`) REFERENCES `office_rentals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transactions_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_request` FOREIGN KEY (`request_id`) REFERENCES `medical_requests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`related_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_audit_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    
    INSERT INTO transaction_audits (transaction_id, action, new_amount, new_status, changed_at)
    VALUES (NEW.id, 'INSERT', NEW.amount, NEW.status, NOW());

    
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_audit_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    
    IF OLD.amount != NEW.amount OR OLD.status != NEW.status THEN
        INSERT INTO transaction_audits (transaction_id, action, old_amount, new_amount, old_status, new_status, changed_at)
        VALUES (NEW.id, 'UPDATE', OLD.amount, NEW.amount, OLD.status, NEW.status, NOW());
    END IF;

    
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF OLD.appointment_id IS NOT NULL AND (NEW.appointment_id IS NULL OR OLD.appointment_id != NEW.appointment_id) THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;

    
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF OLD.rental_id IS NOT NULL AND (NEW.rental_id IS NULL OR OLD.rental_id != NEW.rental_id) THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;

    
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
    IF OLD.request_id IS NOT NULL AND (NEW.request_id IS NULL OR OLD.request_id != NEW.request_id) THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_audit_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    
    INSERT INTO transaction_audits (transaction_id, action, old_amount, old_status, changed_at)
    VALUES (OLD.id, 'DELETE', OLD.amount, OLD.status, NOW());

    
    IF OLD.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;
    IF OLD.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;
    IF OLD.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `user_typing_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_typing_status` (
  `user_id` int(11) NOT NULL,
  `target_id` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`,`target_id`),
  KEY `target_id` (`target_id`),
  CONSTRAINT `user_typing_status_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_typing_status_ibfk_2` FOREIGN KEY (`target_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','secretary','doctor','patient') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `token_version` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10038 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `v_appointment_details`;
/*!50001 DROP VIEW IF EXISTS `v_appointment_details`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_appointment_details` AS SELECT
 NULL AS `id`,
 NULL AS `appointment_date`,
 NULL AS `reason`,
 NULL AS `status`,
 NULL AS `payment_status`,
 NULL AS `type`,
 NULL AS `is_out_of_hours`,
 NULL AS `bonified`,
 NULL AS `cost`,
 NULL AS `google_event_id`,
 NULL AS `rescheduled_from_date`,
 NULL AS `duration`,
 NULL AS `created_at`,
 NULL AS `confirmed_at`,
 NULL AS `arrived_at`,
 NULL AS `completed_at`,
 NULL AS `paid_at`,
 NULL AS `patient_id`,
 NULL AS `patient_name`,
 NULL AS `patient_dni`,
 NULL AS `patient_phone`,
 NULL AS `behavior_rating`,
 NULL AS `doctor_id`,
 NULL AS `doctor_name`,
 NULL AS `doctor_cuit`,
 NULL AS `institution_id`,
 NULL AS `institution_name`,
 NULL AS `institution_base_price`,
 NULL AS `paid_amount`,
 NULL AS `pending_amount`,
 NULL AS `invoice_number`,
 NULL AS `invoice_punto_vta`,
 NULL AS `invoice_cae`,
 NULL AS `attended_appointments` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_medical_request_details`;
/*!50001 DROP VIEW IF EXISTS `v_medical_request_details`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_medical_request_details` AS SELECT
 NULL AS `id`,
 NULL AS `type`,
 NULL AS `patient_id`,
 NULL AS `patient_name`,
 NULL AS `patient_user_id`,
 NULL AS `doctor_id`,
 NULL AS `doctor_name`,
 NULL AS `doctor_user_id`,
 NULL AS `secretary_id`,
 NULL AS `status`,
 NULL AS `request_note`,
 NULL AS `doctor_note`,
 NULL AS `created_at`,
 NULL AS `updated_at`,
 NULL AS `payment_status`,
 NULL AS `payment_method`,
 NULL AS `debt_amount`,
 NULL AS `completed_at`,
 NULL AS `raw_medication_data`,
 NULL AS `is_patient_submitted`,
 NULL AS `resolved_debt_amount`,
 NULL AS `paid_amount`,
 NULL AS `pending_amount` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vademecum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vademecum` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `presentacion` varchar(255) DEFAULT NULL,
  `monodroga` varchar(255) DEFAULT NULL,
  `laboratorio` varchar(255) DEFAULT NULL,
  `vademecum_type` varchar(100) DEFAULT NULL,
  `fcias_propias` varchar(50) DEFAULT NULL,
  `fcias_convenidas` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `idx_vademecum_search` (`nombre`,`presentacion`,`monodroga`,`laboratorio`)
) ENGINE=InnoDB AUTO_INCREMENT=10487 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `view_daily_balances`;
/*!50001 DROP VIEW IF EXISTS `view_daily_balances`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `view_daily_balances` AS SELECT
 NULL AS `transaction_date`,
 NULL AS `doctor_id`,
 NULL AS `doctor_name`,
 NULL AS `cash_balance`,
 NULL AS `transfer_balance`,
 NULL AS `last_activity` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `view_daily_cash_reconciliation`;
/*!50001 DROP VIEW IF EXISTS `view_daily_cash_reconciliation`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `view_daily_cash_reconciliation` AS SELECT
 NULL AS `payment_method`,
 NULL AS `total_income`,
 NULL AS `total_withdrawal`,
 NULL AS `net_balance` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `view_daily_financial_summary`;
/*!50001 DROP VIEW IF EXISTS `view_daily_financial_summary`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `view_daily_financial_summary` AS SELECT
 NULL AS `report_date`,
 NULL AS `doctor_id`,
 NULL AS `total_income`,
 NULL AS `total_cash`,
 NULL AS `total_withdrawal` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `view_doctor_financial_health`;
/*!50001 DROP VIEW IF EXISTS `view_doctor_financial_health`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `view_doctor_financial_health` AS SELECT
 NULL AS `doctor_id`,
 NULL AS `doctor_name`,
 NULL AS `total_collected`,
 NULL AS `total_debt`,
 NULL AS `collection_rate_percent`,
 NULL AS `avg_days_to_collect` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `view_patient_balances`;
/*!50001 DROP VIEW IF EXISTS `view_patient_balances`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `view_patient_balances` AS SELECT
 NULL AS `patient_id`,
 NULL AS `full_name`,
 NULL AS `user_id`,
 NULL AS `total_debt_calculated`,
 NULL AS `debt_status`,
 NULL AS `oldest_debt_days` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `view_patients_extended`;
/*!50001 DROP VIEW IF EXISTS `view_patients_extended`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `view_patients_extended` AS SELECT
 NULL AS `id`,
 NULL AS `user_id`,
 NULL AS `first_name`,
 NULL AS `last_name`,
 NULL AS `full_name`,
 NULL AS `dob`,
 NULL AS `phone`,
 NULL AS `email`,
 NULL AS `medical_history`,
 NULL AS `dni`,
 NULL AS `affiliate_number`,
 NULL AS `insurance_id`,
 NULL AS `tariff_percent`,
 NULL AS `tariff_override`,
 NULL AS `behavior_rating`,
 NULL AS `is_new_patient`,
 NULL AS `marked_new_at`,
 NULL AS `visit_interval_days`,
 NULL AS `prescription_interval_days`,
 NULL AS `next_suggested_visit_date`,
 NULL AS `next_suggested_prescription_date`,
 NULL AS `license_expiry_date`,
 NULL AS `institution_id`,
 NULL AS `street_name`,
 NULL AS `street_number`,
 NULL AS `floor`,
 NULL AS `apartment`,
 NULL AS `city`,
 NULL AS `province`,
 NULL AS `country`,
 NULL AS `visit_notified`,
 NULL AS `prescription_notified`,
 NULL AS `license_notified`,
 NULL AS `username`,
 NULL AS `role`,
 NULL AS `total_appointments`,
 NULL AS `attended_appointments`,
 NULL AS `missed_appointments`,
 NULL AS `last_visit`,
 NULL AS `total_debt_calculated`,
 NULL AS `debt_status`,
 NULL AS `oldest_debt_days`,
 NULL AS `financial_rating` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `view_recent_patients`;
/*!50001 DROP VIEW IF EXISTS `view_recent_patients`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `view_recent_patients` AS SELECT
 NULL AS `id`,
 NULL AS `full_name`,
 NULL AS `dni`,
 NULL AS `phone`,
 NULL AS `total_debt_calculated`,
 NULL AS `debt_status`,
 NULL AS `financial_rating`,
 NULL AS `last_activity` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `whatsapp_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) DEFAULT NULL,
  `sender_phone` varchar(50) DEFAULT NULL,
  `direction` enum('inbound','outbound') NOT NULL DEFAULT 'inbound',
  `body` text DEFAULT NULL,
  `whatsapp_id` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'sent',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_whatsapp_id` (`whatsapp_id`),
  KEY `idx_wm_patient` (`patient_id`),
  KEY `idx_wm_sender_phone` (`sender_phone`),
  KEY `idx_wm_created_at` (`created_at`),
  CONSTRAINT `fk_wm_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `whatsapp_pending_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_pending_bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `patient_phone` varchar(50) NOT NULL,
  `requested_slot_date` date NOT NULL,
  `requested_slot_time` varchar(5) NOT NULL,
  `status` enum('pending','accepted','rejected','alternative_sent','alternative_accepted','alternative_rejected','timed_out') NOT NULL DEFAULT 'pending',
  `accepted_by` int(11) DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `alternative_slot_iso` varchar(30) DEFAULT NULL,
  `alternative_note` text DEFAULT NULL,
  `alternative_sent_at` timestamp NULL DEFAULT NULL,
  `rejected_by` int(11) DEFAULT NULL,
  `rejected_reason` varchar(255) DEFAULT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_wpb_status` (`status`),
  KEY `idx_wpb_patient` (`patient_id`),
  KEY `idx_wpb_doctor` (`doctor_id`),
  KEY `idx_wpb_phone` (`patient_phone`),
  CONSTRAINT `fk_wpb_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wpb_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `v_appointment_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_appointment_details` AS select `a`.`id` AS `id`,`a`.`appointment_date` AS `appointment_date`,`a`.`reason` AS `reason`,`a`.`status` AS `status`,`a`.`payment_status` AS `payment_status`,`a`.`type` AS `type`,`a`.`is_out_of_hours` AS `is_out_of_hours`,`a`.`bonified` AS `bonified`,`a`.`cost` AS `cost`,`a`.`google_event_id` AS `google_event_id`,`a`.`rescheduled_from_date` AS `rescheduled_from_date`,`a`.`duration` AS `duration`,`a`.`created_at` AS `created_at`,`a`.`confirmed_at` AS `confirmed_at`,`a`.`arrived_at` AS `arrived_at`,`a`.`completed_at` AS `completed_at`,`a`.`paid_at` AS `paid_at`,`a`.`patient_id` AS `patient_id`,`p`.`full_name` AS `patient_name`,`p`.`dni` AS `patient_dni`,`p`.`phone` AS `patient_phone`,`p`.`behavior_rating` AS `behavior_rating`,`a`.`doctor_id` AS `doctor_id`,`d`.`full_name` AS `doctor_name`,`d`.`afip_cuit` AS `doctor_cuit`,`a`.`institution_id` AS `institution_id`,`inst`.`name` AS `institution_name`,`inst`.`base_price` AS `institution_base_price`,coalesce(`tx`.`paid_amount`,0) AS `paid_amount`,coalesce(`tx`.`pending_amount`,0) AS `pending_amount`,`inv`.`invoice_number` AS `invoice_number`,`inv`.`invoice_punto_vta` AS `invoice_punto_vta`,`inv`.`invoice_cae` AS `invoice_cae`,(select count(0) from `appointments` `a2` where `a2`.`patient_id` = `a`.`patient_id` and `a2`.`status` in ('attended','completed')) AS `attended_appointments` from (((((`appointments` `a` left join `patients` `p` on(`a`.`patient_id` = `p`.`id`)) join `doctors` `d` on(`a`.`doctor_id` = `d`.`id`)) left join `institutions` `inst` on(`a`.`institution_id` = `inst`.`id`)) left join (select `transactions`.`appointment_id` AS `appointment_id`,sum(case when `transactions`.`status` = 'paid' then `transactions`.`amount` else 0 end) AS `paid_amount`,sum(case when `transactions`.`status` = 'pending' then `transactions`.`amount` else 0 end) AS `pending_amount` from `transactions` where `transactions`.`is_withdrawal` = 0 group by `transactions`.`appointment_id`) `tx` on(`tx`.`appointment_id` = `a`.`id`)) left join (select `t`.`appointment_id` AS `appointment_id`,min(`i`.`cbte_nro`) AS `invoice_number`,min(`i`.`punto_vta`) AS `invoice_punto_vta`,min(`i`.`cae`) AS `invoice_cae` from (`invoices` `i` join `transactions` `t` on(`i`.`transaction_id` = `t`.`id`)) where `t`.`appointment_id` is not null group by `t`.`appointment_id`) `inv` on(`inv`.`appointment_id` = `a`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_medical_request_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_medical_request_details` AS select `r`.`id` AS `id`,`r`.`type` AS `type`,`r`.`patient_id` AS `patient_id`,`p`.`full_name` AS `patient_name`,`p`.`user_id` AS `patient_user_id`,`r`.`doctor_id` AS `doctor_id`,`d`.`full_name` AS `doctor_name`,`d`.`user_id` AS `doctor_user_id`,`r`.`secretary_id` AS `secretary_id`,`r`.`status` AS `status`,`r`.`request_note` AS `request_note`,`r`.`doctor_note` AS `doctor_note`,`r`.`created_at` AS `created_at`,`r`.`updated_at` AS `updated_at`,`r`.`payment_status` AS `payment_status`,`r`.`payment_method` AS `payment_method`,`r`.`debt_amount` AS `debt_amount`,`r`.`completed_at` AS `completed_at`,`r`.`raw_medication_data` AS `raw_medication_data`,`r`.`is_patient_submitted` AS `is_patient_submitted`,coalesce(nullif(`r`.`debt_amount`,0),0) AS `resolved_debt_amount`,coalesce(`tx`.`paid_amount`,0) AS `paid_amount`,coalesce(`tx`.`pending_amount`,0) AS `pending_amount` from (((`medical_requests` `r` left join `patients` `p` on(`r`.`patient_id` = `p`.`id`)) left join `doctors` `d` on(`r`.`doctor_id` = `d`.`id`)) left join (select `transactions`.`request_id` AS `request_id`,sum(case when `transactions`.`status` = 'paid' then `transactions`.`amount` else 0 end) AS `paid_amount`,sum(case when `transactions`.`status` = 'pending' then `transactions`.`amount` else 0 end) AS `pending_amount` from `transactions` where `transactions`.`is_withdrawal` = 0 and `transactions`.`request_id` is not null group by `transactions`.`request_id`) `tx` on(`tx`.`request_id` = `r`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `view_daily_balances`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_daily_balances` AS select cast(`t`.`transaction_date` as date) AS `transaction_date`,`t`.`doctor_id` AS `doctor_id`,`d`.`full_name` AS `doctor_name`,sum(case when `t`.`method` = 'cash' then case when `t`.`is_withdrawal` = 1 then -`t`.`amount` when `t`.`type` like 'income%' or `t`.`type` = 'income' then `t`.`amount` when `t`.`type` like 'expense%' or `t`.`type` = 'expense' then -`t`.`amount` else 0 end else 0 end) AS `cash_balance`,sum(case when `t`.`method` <> 'cash' then case when `t`.`is_withdrawal` = 1 then -`t`.`amount` when `t`.`type` like 'income%' or `t`.`type` = 'income' then `t`.`amount` when `t`.`type` like 'expense%' or `t`.`type` = 'expense' then -`t`.`amount` else 0 end else 0 end) AS `transfer_balance`,max(`t`.`transaction_date`) AS `last_activity` from (`transactions` `t` left join `doctors` `d` on(`t`.`doctor_id` = `d`.`id`)) where `t`.`status` = 'paid' group by cast(`t`.`transaction_date` as date),`t`.`doctor_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `view_daily_cash_reconciliation`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_daily_cash_reconciliation` AS select coalesce(`method`,'TOTAL') AS `payment_method`,sum(case when `t`.`is_withdrawal` = 0 then `t`.`amount` else 0 end) AS `total_income`,sum(case when `t`.`is_withdrawal` = 1 then `t`.`amount` else 0 end) AS `total_withdrawal`,sum(case when `t`.`is_withdrawal` = 0 then `t`.`amount` else 0 end) - sum(case when `t`.`is_withdrawal` = 1 then `t`.`amount` else 0 end) AS `net_balance` from `transactions` `t` where cast(`t`.`transaction_date` as date) = curdate() and `t`.`status` = 'paid' group by `t`.`method` with rollup */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `view_daily_financial_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_daily_financial_summary` AS select cast(`transactions`.`transaction_date` as date) AS `report_date`,`transactions`.`doctor_id` AS `doctor_id`,sum(case when `transactions`.`is_withdrawal` = 0 and `transactions`.`status` = 'paid' then `transactions`.`amount` else 0 end) AS `total_income`,sum(case when `transactions`.`is_withdrawal` = 0 and `transactions`.`status` = 'paid' and (`transactions`.`method` = 'cash' or `transactions`.`method` = 'efectivo') then `transactions`.`amount` else 0 end) AS `total_cash`,sum(case when `transactions`.`is_withdrawal` = 1 and `transactions`.`status` = 'paid' then `transactions`.`amount` else 0 end) AS `total_withdrawal` from `transactions` group by cast(`transactions`.`transaction_date` as date),`transactions`.`doctor_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `view_doctor_financial_health`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_doctor_financial_health` AS select `d`.`id` AS `doctor_id`,`d`.`full_name` AS `doctor_name`,coalesce(sum(case when `t`.`status` = 'paid' and `t`.`is_withdrawal` = 0 then `t`.`amount` else 0 end),0) AS `total_collected`,coalesce(sum(case when `t`.`status` = 'pending' then `t`.`amount` else 0 end),0) AS `total_debt`,case when sum(case when `t`.`is_withdrawal` = 0 then `t`.`amount` else 0 end) = 0 then 100 else sum(case when `t`.`status` = 'paid' and `t`.`is_withdrawal` = 0 then `t`.`amount` else 0 end) / sum(case when `t`.`is_withdrawal` = 0 then `t`.`amount` else 0 end) * 100 end AS `collection_rate_percent`,(select avg(to_days(`ta`.`changed_at`) - to_days(`t2`.`transaction_date`)) from (`transaction_audits` `ta` join `transactions` `t2` on(`ta`.`transaction_id` = `t2`.`id`)) where `t2`.`doctor_id` = `d`.`id` and `ta`.`new_status` = 'paid' and `ta`.`old_status` = 'pending') AS `avg_days_to_collect` from (`doctors` `d` left join `transactions` `t` on(`d`.`id` = `t`.`doctor_id`)) group by `d`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `view_patient_balances`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_patient_balances` AS select `p`.`id` AS `patient_id`,`p`.`full_name` AS `full_name`,`p`.`user_id` AS `user_id`,coalesce(sum(case when `t`.`status` = 'pending' then `t`.`amount` else 0 end),0) AS `total_debt_calculated`,case when coalesce(sum(case when `t`.`status` = 'pending' then `t`.`amount` else 0 end),0) <= 0 then 'green' when max(case when `t`.`status` = 'pending' then to_days(current_timestamp()) - to_days(`t`.`transaction_date`) else 0 end) > 30 then 'red' when sum(case when `t`.`status` = 'pending' then `t`.`amount` else 0 end) > 20000 then 'red' else 'yellow' end AS `debt_status`,max(case when `t`.`status` = 'pending' then to_days(current_timestamp()) - to_days(`t`.`transaction_date`) else 0 end) AS `oldest_debt_days` from (`patients` `p` left join `transactions` `t` on(`p`.`user_id` = `t`.`related_user_id`)) group by `p`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `view_patients_extended`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_patients_extended` AS select `p`.`id` AS `id`,`p`.`user_id` AS `user_id`,`p`.`first_name` AS `first_name`,`p`.`last_name` AS `last_name`,`p`.`full_name` AS `full_name`,`p`.`dob` AS `dob`,`p`.`phone` AS `phone`,`p`.`email` AS `email`,`p`.`medical_history` AS `medical_history`,`p`.`dni` AS `dni`,`p`.`affiliate_number` AS `affiliate_number`,`p`.`insurance_id` AS `insurance_id`,`p`.`tariff_percent` AS `tariff_percent`,`p`.`tariff_override` AS `tariff_override`,`p`.`behavior_rating` AS `behavior_rating`,`p`.`is_new_patient` AS `is_new_patient`,`p`.`marked_new_at` AS `marked_new_at`,`p`.`visit_interval_days` AS `visit_interval_days`,`p`.`prescription_interval_days` AS `prescription_interval_days`,`p`.`next_suggested_visit_date` AS `next_suggested_visit_date`,`p`.`next_suggested_prescription_date` AS `next_suggested_prescription_date`,`p`.`license_expiry_date` AS `license_expiry_date`,`p`.`institution_id` AS `institution_id`,`p`.`street_name` AS `street_name`,`p`.`street_number` AS `street_number`,`p`.`floor` AS `floor`,`p`.`apartment` AS `apartment`,`p`.`city` AS `city`,`p`.`province` AS `province`,`p`.`country` AS `country`,`p`.`visit_notified` AS `visit_notified`,`p`.`prescription_notified` AS `prescription_notified`,`p`.`license_notified` AS `license_notified`,`u`.`username` AS `username`,`u`.`role` AS `role`,coalesce(`appt_stats`.`total_appointments`,0) AS `total_appointments`,coalesce(`appt_stats`.`attended_appointments`,0) AS `attended_appointments`,coalesce(`appt_stats`.`missed_appointments`,0) AS `missed_appointments`,`appt_stats`.`last_visit` AS `last_visit`,coalesce(`b`.`total_debt_calculated`,0) AS `total_debt_calculated`,coalesce(`b`.`debt_status`,'green') AS `debt_status`,`b`.`oldest_debt_days` AS `oldest_debt_days`,case when coalesce(`b`.`total_debt_calculated`,0) <= 0 then 5 when `b`.`total_debt_calculated` < 1000 then 4 when `b`.`total_debt_calculated` < 5000 then 3 when `b`.`total_debt_calculated` < 10000 then 2 else 1 end AS `financial_rating` from (((`patients` `p` join `users` `u` on(`p`.`user_id` = `u`.`id`)) left join `view_patient_balances` `b` on(`p`.`id` = `b`.`patient_id`)) left join (select `appointments`.`patient_id` AS `patient_id`,count(0) AS `total_appointments`,count(case when `appointments`.`status` in ('attended','completed') then 1 end) AS `attended_appointments`,count(case when `appointments`.`status` = 'absent' or `appointments`.`status` = 'cancelled' and coalesce(`appointments`.`cancellation_reason`,'')  not like '%error%' then 1 end) AS `missed_appointments`,max(`appointments`.`appointment_date`) AS `last_visit` from `appointments` group by `appointments`.`patient_id`) `appt_stats` on(`appt_stats`.`patient_id` = `p`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `view_recent_patients`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_recent_patients` AS select `p`.`id` AS `id`,`p`.`full_name` AS `full_name`,`p`.`dni` AS `dni`,`p`.`phone` AS `phone`,`p`.`total_debt_calculated` AS `total_debt_calculated`,`p`.`debt_status` AS `debt_status`,`p`.`financial_rating` AS `financial_rating`,greatest(coalesce((select max(`a`.`appointment_date`) from `appointments` `a` where `a`.`patient_id` = `p`.`id`),'1970-01-01'),coalesce(`p`.`marked_new_at`,'1970-01-01')) AS `last_activity` from `view_patients_extended` `p` order by greatest(coalesce((select max(`a`.`appointment_date`) from `appointments` `a` where `a`.`patient_id` = `p`.`id`),'1970-01-01'),coalesce(`p`.`marked_new_at`,'1970-01-01')) desc limit 10 */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_office_rental_insert
AFTER INSERT ON office_rentals
FOR EACH ROW
BEGIN
    INSERT INTO transactions (
        type,
        amount,
        description,
        doctor_id,
        status,
        method,
        is_withdrawal,
        related_user_id,
        transaction_date,
        rental_id
    ) VALUES (
        'income_rental',
        NEW.cost,
        CONCAT('Alquiler de Consultorio (Reserva): ', NEW.rental_date),
        NEW.doctor_id,
        CASE WHEN NEW.cost = 0 THEN 'paid' ELSE 'pending' END,
        CASE WHEN NEW.cost = 0 THEN 'bonified' ELSE 'on_account' END,
        0,
        (SELECT user_id FROM doctors WHERE id = NEW.doctor_id),
        NOW(),
        NEW.id
    );
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_audit_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    
    INSERT INTO transaction_audits (transaction_id, action, new_amount, new_status, changed_at)
    VALUES (NEW.id, 'INSERT', NEW.amount, NEW.status, NOW());

    
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_audit_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    
    IF OLD.amount != NEW.amount OR OLD.status != NEW.status THEN
        INSERT INTO transaction_audits (transaction_id, action, old_amount, new_amount, old_status, new_status, changed_at)
        VALUES (NEW.id, 'UPDATE', OLD.amount, NEW.amount, OLD.status, NEW.status, NOW());
    END IF;

    
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF OLD.appointment_id IS NOT NULL AND (NEW.appointment_id IS NULL OR OLD.appointment_id != NEW.appointment_id) THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;

    
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF OLD.rental_id IS NOT NULL AND (NEW.rental_id IS NULL OR OLD.rental_id != NEW.rental_id) THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;

    
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
    IF OLD.request_id IS NOT NULL AND (NEW.request_id IS NULL OR OLD.request_id != NEW.request_id) THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_audit_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    
    INSERT INTO transaction_audits (transaction_id, action, old_amount, old_status, changed_at)
    VALUES (OLD.id, 'DELETE', OLD.amount, OLD.status, NOW());

    
    IF OLD.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;
    IF OLD.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;
    IF OLD.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END 
*/;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_calculate_service_price` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_calculate_service_price`(p_doctor_id INT,
    p_patient_id INT,
    p_service_type VARCHAR(50),
    p_institution_id INT
) RETURNS decimal(10,2)
    DETERMINISTIC
BEGIN
    DECLARE v_base_price DECIMAL(10,2) DEFAULT 0;
    DECLARE v_final_price DECIMAL(10,2) DEFAULT 0;
    DECLARE v_tariff_percent INT DEFAULT 0;
    DECLARE v_tariff_override DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_inst_price DECIMAL(10,2) DEFAULT 0;

    
    SELECT 
        CASE p_service_type
            WHEN 'prescription' THEN COALESCE(prescription_price, 0)
            WHEN 'medical_license' THEN COALESCE(medical_license_price, 0)
            WHEN 'certificate' THEN COALESCE(certificate_price, 0)
            WHEN 'virtual_consultation' THEN COALESCE(virtual_consultation_price, 0)
            ELSE COALESCE(consultation_price, 0)
        END INTO v_base_price
    FROM doctors WHERE id = p_doctor_id;

    
    IF p_institution_id IS NOT NULL THEN
        SELECT COALESCE(base_price, 0) INTO v_inst_price FROM institutions WHERE id = p_institution_id;
    END IF;

    
    IF p_patient_id IS NOT NULL THEN
        SELECT COALESCE(tariff_percent, 0), tariff_override 
        INTO v_tariff_percent, v_tariff_override
        FROM patients WHERE id = p_patient_id;
    END IF;

    
    SET v_final_price = v_base_price;
    
    IF v_inst_price > 0 THEN
        SET v_base_price = v_inst_price;
        SET v_final_price = 0; 
    END IF;

    
    IF v_tariff_override > 0 AND (p_service_type = 'consultation' OR p_service_type IS NULL OR p_service_type = '') THEN
        SET v_final_price = v_tariff_override;
    ELSEIF v_tariff_percent != 0 THEN
        
        SET v_final_price = v_final_price + (v_base_price * (v_tariff_percent / 100));
    END IF;

    RETURN v_final_price;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `proc_pay_doctor_debt` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_pay_doctor_debt`(
    IN p_doctor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_method VARCHAR(50),
    IN p_description_prefix VARCHAR(255),
    IN p_idempotency_key VARCHAR(100)
)
    MODIFIES SQL DATA
BEGIN
    DECLARE v_remaining DECIMAL(10,2) DEFAULT p_amount;
    DECLARE v_user_id INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_debt_id INT;
    DECLARE v_debt_amount DECIMAL(10,2);
    DECLARE v_debt_desc VARCHAR(255);
    DECLARE v_rental_id INT;

    
    DECLARE cur_debts CURSOR FOR 
        SELECT t.id, t.amount, t.description, t.rental_id
        FROM transactions t
        JOIN doctors d ON t.related_user_id = d.user_id
        WHERE d.id = p_doctor_id AND t.status = 'pending'
        ORDER BY t.transaction_date ASC, t.id ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    
    SELECT user_id INTO v_user_id FROM doctors WHERE id = p_doctor_id;
    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Doctor not found';
    END IF;

    OPEN cur_debts;

    read_loop: LOOP
        FETCH cur_debts INTO v_debt_id, v_debt_amount, v_debt_desc, v_rental_id;
        IF done OR v_remaining <= 0.01 THEN
            LEAVE read_loop;
        END IF;

        IF v_remaining >= v_debt_amount THEN
            
            UPDATE transactions SET 
                status = 'paid', 
                method = p_method, 
                description = CONCAT(p_description_prefix, ': ', v_debt_desc, ' - FULL PAID')
            WHERE id = v_debt_id;
            
            SET v_remaining = v_remaining - v_debt_amount;
        ELSE
            
            UPDATE transactions SET 
                status = 'paid', 
                amount = v_remaining, 
                method = p_method, 
                description = CONCAT(p_description_prefix, ': ', v_debt_desc, ' - PARTIAL PAID')
            WHERE id = v_debt_id;

            INSERT INTO transactions (
                type, amount, description, related_user_id, doctor_id, 
                method, status, rental_id, transaction_date
            ) VALUES (
                'income_rental', v_debt_amount - v_remaining, v_debt_desc, v_user_id, p_doctor_id,
                'on_account', 'pending', v_rental_id, NOW()
            );

            SET v_remaining = 0;
        END IF;

        
        IF v_rental_id IS NOT NULL THEN
            CALL sp_sync_rental_payment_status(v_rental_id);
        END IF;
    END LOOP;

    CLOSE cur_debts;

    
    IF v_remaining > 0.01 THEN
        INSERT INTO transactions (
            type, amount, description, related_user_id, doctor_id, 
            method, status, transaction_date
        ) VALUES (
            'income_rental', v_remaining, 'Advance Rental Payment / Credit Balance', v_user_id, p_doctor_id,
            p_method, 'paid', NOW()
        );
    END IF;

    COMMIT;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `proc_pay_patient_debt` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_pay_patient_debt`(
    IN p_patient_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_method VARCHAR(50),
    IN p_doctor_id INT,
    IN p_description_prefix VARCHAR(255),
    IN p_idempotency_key VARCHAR(100)
)
    MODIFIES SQL DATA
BEGIN
    DECLARE v_remaining DECIMAL(10,2) DEFAULT p_amount;
    DECLARE v_user_id INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_debt_id INT;
    DECLARE v_debt_amount DECIMAL(10,2);
    DECLARE v_debt_desc VARCHAR(255);
    DECLARE v_appt_id INT;
    DECLARE v_req_id INT;

    
    DECLARE cur_debts CURSOR FOR 
        SELECT t.id, t.amount, t.description, t.appointment_id, t.request_id
        FROM transactions t
        JOIN patients p ON t.related_user_id = p.user_id
        WHERE p.id = p_patient_id AND t.status = 'pending'
        ORDER BY t.transaction_date ASC, t.id ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    
    SELECT user_id INTO v_user_id FROM patients WHERE id = p_patient_id;
    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Patient not found';
    END IF;

    OPEN cur_debts;

    read_loop: LOOP
        FETCH cur_debts INTO v_debt_id, v_debt_amount, v_debt_desc, v_appt_id, v_req_id;
        IF done OR v_remaining <= 0.01 THEN
            LEAVE read_loop;
        END IF;

        IF v_remaining >= v_debt_amount THEN
            
            UPDATE transactions SET 
                status = 'paid', 
                method = p_method, 
                description = CONCAT(p_description_prefix, ': ', v_debt_desc, ' - FULL PAID')
            WHERE id = v_debt_id;
            
            SET v_remaining = v_remaining - v_debt_amount;
        ELSE
            
            UPDATE transactions SET 
                status = 'paid', 
                amount = v_remaining, 
                method = p_method, 
                description = CONCAT(p_description_prefix, ': ', v_debt_desc, ' - PARTIAL PAID')
            WHERE id = v_debt_id;

            INSERT INTO transactions (
                type, amount, description, related_user_id, doctor_id, 
                method, status, appointment_id, request_id, transaction_date
            ) VALUES (
                'income_patient', v_debt_amount - v_remaining, v_debt_desc, v_user_id, p_doctor_id,
                'on_account', 'pending', v_appt_id, v_req_id, NOW()
            );

            SET v_remaining = 0;
        END IF;

        
        IF v_appt_id IS NOT NULL THEN
            CALL sp_sync_appointment_payment_status(v_appt_id);
        END IF;
        IF v_req_id IS NOT NULL THEN
            CALL sp_sync_request_payment_status(v_req_id);
        END IF;
    END LOOP;

    CLOSE cur_debts;

    
    IF v_remaining > 0.01 THEN
        INSERT INTO transactions (
            type, amount, description, related_user_id, doctor_id, 
            method, status, transaction_date
        ) VALUES (
            'income_patient', v_remaining, 'Advance Payment / Credit Balance', v_user_id, p_doctor_id,
            p_method, 'paid', NOW()
        );
    END IF;

    COMMIT;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_book_appointment` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_book_appointment`(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_appointment_date DATETIME,
    IN p_reason VARCHAR(255),
    IN p_is_out_of_hours TINYINT,
    IN p_type ENUM('consultation', 'virtual'),
    IN p_institution_id INT,
    IN p_bonified TINYINT,
    IN p_created_by INT,
    OUT p_appointment_id INT
)
BEGIN
    DECLARE v_existing_active INT DEFAULT 0;
    
    
    SELECT COUNT(*) INTO v_existing_active
    FROM appointments
    WHERE doctor_id = p_doctor_id 
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled', 'absent', 'suspended', 'reserved');
    
    IF v_existing_active > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'slot_already_taken';
    END IF;

    
    INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, reason, 
        is_out_of_hours, type, status, institution_id, bonified, created_at
    ) VALUES (
        p_patient_id, p_doctor_id, p_appointment_date, p_reason, 
        p_is_out_of_hours, p_type, 'pending', p_institution_id, p_bonified, NOW()
    );
    
    SET p_appointment_id = LAST_INSERT_ID();

    
    IF p_bonified = 1 THEN
        INSERT INTO transactions (
            type, amount, description, related_user_id, doctor_id, 
            institution_id, method, status, appointment_id, transaction_date
        ) VALUES (
            'income', 0, CONCAT(p_reason, ' (Bonificado)'), 
            (SELECT user_id FROM patients WHERE id = p_patient_id),
            p_doctor_id, p_institution_id, 'bonified', 'paid', p_appointment_id, p_appointment_date
        );
        
        UPDATE appointments SET cost = 0.00 WHERE id = p_appointment_id;
    ELSE
        BEGIN
            DECLARE v_patient_price DECIMAL(15,2);
            DECLARE v_base_price DECIMAL(15,2);
            DECLARE v_inst_share DECIMAL(15,2) DEFAULT 0;
            DECLARE v_pat_user_id INT;
            
            SELECT user_id INTO v_pat_user_id FROM patients WHERE id = p_patient_id;
            
            
            SET v_patient_price = fn_calculate_service_price(p_doctor_id, p_patient_id, 'consultation', p_institution_id);
            
            
            IF p_institution_id IS NOT NULL THEN
                SELECT COALESCE(base_price, 0) INTO v_base_price FROM institutions WHERE id = p_institution_id;
                IF v_base_price > v_patient_price THEN
                    SET v_inst_share = v_base_price - v_patient_price;
                END IF;
            END IF;

            
            INSERT INTO transactions (
                type, amount, description, related_user_id, doctor_id, 
                institution_id, method, status, appointment_id, transaction_date
            ) VALUES (
                'income', v_patient_price, p_reason, v_pat_user_id,
                p_doctor_id, p_institution_id, 'on_account', 'pending', p_appointment_id, p_appointment_date
            );
            
            
            IF v_inst_share > 0 THEN
                INSERT INTO transactions (
                    type, amount, description, related_user_id, doctor_id, 
                    institution_id, method, status, appointment_id, transaction_date
                ) VALUES (
                    'income', v_inst_share, CONCAT(p_reason, ' (Inst. Share)'), v_pat_user_id,
                    p_doctor_id, p_institution_id, 'on_account', 'pending', p_appointment_id, p_appointment_date
                );
            END IF;

            
            UPDATE appointments SET cost = v_patient_price + v_inst_share WHERE id = p_appointment_id;
        END;
    END IF;

    
    CALL sp_sync_appointment_payment_status(p_appointment_id);
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_create_transaction` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_transaction`(
    IN  p_type             VARCHAR(50),
    IN  p_amount           DECIMAL(10,2),
    IN  p_method           VARCHAR(50),
    IN  p_description      VARCHAR(255),
    IN  p_doctor_id        INT,
    IN  p_status           VARCHAR(50),
    IN  p_is_withdrawal    TINYINT(1),
    IN  p_related_user_id  INT,
    IN  p_transaction_date TIMESTAMP,
    IN  p_appointment_id   INT,
    IN  p_request_id       INT,
    IN  p_rental_id        INT,
    IN  p_idempotency_key  VARCHAR(100),
    OUT p_id               INT
)
BEGIN
    INSERT INTO transactions (
        type,
        amount,
        method,
        description,
        doctor_id,
        status,
        is_withdrawal,
        related_user_id,
        transaction_date,
        appointment_id,
        request_id,
        rental_id
    ) VALUES (
        p_type,
        p_amount,
        COALESCE(p_method,  'cash'),
        p_description,
        p_doctor_id,
        COALESCE(p_status,  'paid'),
        COALESCE(p_is_withdrawal, 0),
        p_related_user_id,
        COALESCE(p_transaction_date, NOW()),
        p_appointment_id,
        p_request_id,
        p_rental_id
    );

    SET p_id = LAST_INSERT_ID();
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_daily_schedule` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_daily_schedule`(
    IN p_doctor_id INT,
    IN p_date_str VARCHAR(10)
)
BEGIN
    DECLARE v_duration INT;
    DECLARE v_overturn_start TIME;
    DECLARE v_overturn_end TIME;
    DECLARE v_force_alignment TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_slot_dur INT;
    DECLARE v_date DATE;
    DECLARE v_day_of_week INT;
    DECLARE v_is_holiday TINYINT DEFAULT 0;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_slots;

    SET v_date = STR_TO_DATE(p_date_str, '%Y-%m-%d');
    SET v_day_of_week = DAYOFWEEK(v_date) - 1;

    SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_date;

    SELECT 
        COALESCE(appointment_duration, 60), 
        COALESCE(overturn_start_time, '08:00:00'), 
        COALESCE(overturn_end_time, '21:00:00'),
        COALESCE(force_hour_alignment, 0)
    INTO 
        v_duration, 
        v_overturn_start, 
        v_overturn_end,
        v_force_alignment
    FROM doctors 
    WHERE id = p_doctor_id;

    SET v_current_time = v_overturn_start;

    WHILE v_current_time < v_overturn_end DO
        SET v_slot_dur = v_duration;
        
        IF v_force_alignment = 1 AND (TIME_TO_SEC(v_current_time) % 3600) != 0 THEN
            SET v_slot_dur = 60 - ((TIME_TO_SEC(v_current_time) % 3600) / 60);
        END IF;

        IF TIME_TO_SEC(v_current_time) + (v_slot_dur * 60) > TIME_TO_SEC(v_overturn_end) THEN
            SET v_current_time = v_overturn_end;
        ELSE
            BEGIN
                DECLARE v_is_official TINYINT DEFAULT 0;
                DECLARE v_is_break TINYINT DEFAULT 0;
                DECLARE v_status VARCHAR(50);

                IF v_is_holiday = 1 THEN
                    SET v_status = 'closed_holiday';
                ELSE
                    SELECT COUNT(*) INTO v_is_official
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 0
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    SELECT COUNT(*) INTO v_is_break
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 1
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    IF v_is_break > 0 THEN
                        SET v_status = 'break';
                    ELSEIF v_is_official > 0 THEN
                        SET v_status = 'free';
                    ELSE
                        SET v_status = 'out_of_hours';
                    END IF;
                END IF;

                INSERT INTO temp_slots (slot_date, slot_time, slot_status, is_out_of_hours)
                VALUES (v_date, v_current_time, v_status, CASE WHEN v_status = 'out_of_hours' THEN 1 ELSE 0 END);
            END;

            SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_dur * 60));
        END IF;
    END WHILE;

    SELECT 
        a.id,
        a.appointment_date,
        p_doctor_id as doctor_id,
        d.full_name as doctor_name,
        a.patient_id,
        a.patient_name,
        a.patient_phone,
        a.status,
        a.reason,
        a.type,
        ts.is_out_of_hours,
        a.paid_amount,
        a.pending_amount,
        a.cost,
        a.payment_status,
        a.rescheduled_from_date,
        a.created_at,
        a.confirmed_at,
        a.arrived_at,
        a.completed_at,
        a.paid_at,
        ts.slot_date,
        ts.slot_time,
        CASE 
            WHEN a.id IS NOT NULL THEN 'taken' 
            ELSE ts.slot_status 
        END as slot_status
    FROM temp_slots ts
    LEFT JOIN v_appointment_details a 
        ON a.doctor_id = p_doctor_id 
        AND DATE(a.appointment_date) = ts.slot_date 
        AND TIME(a.appointment_date) = ts.slot_time
        AND a.status NOT IN ('cancelled', 'suspended')
    LEFT JOIN doctors d ON d.id = p_doctor_id
    ORDER BY ts.slot_time;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_free_slots` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_free_slots`(
    IN p_doctor_id INT,
    IN p_start_date_str VARCHAR(10),
    IN p_days_to_check INT,
    IN p_include_out_of_hours INT
)
BEGIN
    DECLARE v_days_counter INT DEFAULT 0;
    DECLARE v_current_date DATE;
    DECLARE v_duration INT;
    DECLARE v_overturn_start TIME;
    DECLARE v_overturn_end TIME;
    DECLARE v_force_alignment TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_slot_dur INT;
    DECLARE v_day_of_week INT;
    DECLARE v_is_holiday TINYINT;

    
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_all_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_break TINYINT,
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_all_slots;

    
    SELECT 
        COALESCE(appointment_duration, 60), 
        COALESCE(overturn_start_time, '08:00:00'), 
        COALESCE(overturn_end_time, '21:00:00'),
        COALESCE(force_hour_alignment, 0)
    INTO 
        v_duration, 
        v_overturn_start, 
        v_overturn_end,
        v_force_alignment
    FROM doctors 
    WHERE id = p_doctor_id;

    
    WHILE v_days_counter < p_days_to_check DO
        SET v_current_date = DATE_ADD(STR_TO_DATE(p_start_date_str, '%Y-%m-%d'), INTERVAL v_days_counter DAY);
        SET v_day_of_week = DAYOFWEEK(v_current_date) - 1;

        
        SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_current_date;

        IF v_is_holiday = 0 THEN
            SET v_current_time = v_overturn_start;

            
            WHILE v_current_time < v_overturn_end DO
                SET v_slot_dur = v_duration;
                
                IF v_force_alignment = 1 AND (TIME_TO_SEC(v_current_time) % 3600) != 0 THEN
                    SET v_slot_dur = 60 - ((TIME_TO_SEC(v_current_time) % 3600) / 60);
                END IF;

                IF TIME_TO_SEC(v_current_time) + (v_slot_dur * 60) > TIME_TO_SEC(v_overturn_end) THEN
                    SET v_current_time = v_overturn_end;
                ELSE
                    BEGIN
                        DECLARE v_is_official TINYINT DEFAULT 0;
                        DECLARE v_is_break TINYINT DEFAULT 0;
                        DECLARE v_status VARCHAR(50);

                        
                        SELECT COUNT(*) INTO v_is_official
                        FROM doctor_schedules
                        WHERE doctor_id = p_doctor_id
                          AND day_of_week = v_day_of_week
                          AND is_break = 0
                          AND v_current_time >= start_time
                          AND v_current_time < end_time;

                        
                        SELECT COUNT(*) INTO v_is_break
                        FROM doctor_schedules
                        WHERE doctor_id = p_doctor_id
                          AND day_of_week = v_day_of_week
                          AND is_break = 1
                          AND v_current_time >= start_time
                          AND v_current_time < end_time;

                        IF v_is_break > 0 THEN
                            SET v_status = 'break';
                        ELSEIF v_is_official > 0 THEN
                            SET v_status = 'free';
                        ELSE
                            SET v_status = 'out_of_hours';
                        END IF;

                        
                        IF v_status = 'free' OR v_status = 'break' OR (p_include_out_of_hours = 1 AND v_status = 'out_of_hours') THEN
                            INSERT INTO temp_all_slots (slot_date, slot_time, slot_status, is_break, is_out_of_hours)
                            VALUES (v_current_date, v_current_time, v_status, CASE WHEN v_status = 'break' THEN 1 ELSE 0 END, CASE WHEN v_status = 'out_of_hours' THEN 1 ELSE 0 END);
                        END IF;
                    END;

                    SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_dur * 60));
                END IF;
            END WHILE;
        END IF;

        SET v_days_counter = v_days_counter + 1;
    END WHILE;

    
    SELECT 
        ts.slot_date as date,
        TIME_FORMAT(ts.slot_time, '%H:%i') as time,
        CONCAT(ts.slot_date, 'T', ts.slot_time, '-03:00') as iso,
        ts.is_break,
        ts.is_out_of_hours
    FROM temp_all_slots ts
    LEFT JOIN appointments a 
        ON a.doctor_id = p_doctor_id 
        AND DATE(a.appointment_date) = ts.slot_date 
        AND TIME(a.appointment_date) = ts.slot_time
        AND a.status NOT IN ('cancelled', 'suspended')
    WHERE a.id IS NULL
      AND ts.slot_status != 'break'
    ORDER BY ts.slot_date, ts.slot_time;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_search_suggestions` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_search_suggestions`(
    IN p_user_id INT,
    IN p_role    VARCHAR(50)
)
BEGIN
    DECLARE v_doctor_id INT DEFAULT NULL;

    IF p_role = 'doctor' THEN
        SELECT id INTO v_doctor_id
        FROM doctors
        WHERE user_id = p_user_id
        LIMIT 1;
    END IF;

    SELECT
        p.id,
        p.full_name,
        p.dni,
        p.phone,
        p.total_debt_calculated,
        p.debt_status,
        p.last_activity
    FROM view_recent_patients p
    WHERE
        p_role NOT IN ('doctor')
        OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = v_doctor_id
        )
    ORDER BY p.last_activity DESC
    LIMIT 10;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mark_as_bonified` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_mark_as_bonified`(
    IN p_id   INT,
    IN p_type VARCHAR(50)
)
BEGIN
    IF p_type = 'appointment' THEN
        UPDATE transactions
        SET
            amount  = 0,
            method  = 'bonified',
            status  = 'paid'
        WHERE appointment_id = p_id;

        
        UPDATE appointments
        SET bonified = 1
        WHERE id = p_id;

    ELSEIF p_type = 'prescription' THEN
        
        UPDATE transactions
        SET
            amount  = 0,
            method  = 'bonified',
            status  = 'paid'
        WHERE request_id = p_id;

    END IF;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_search_appointments` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_search_appointments`(
    IN p_search VARCHAR(255),
    IN p_doctor_id INT,
    IN p_patient_id INT,
    IN p_status VARCHAR(50),
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_page INT,
    IN p_limit INT,
    OUT p_total_count INT
)
BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;

    
    SELECT COUNT(*) INTO p_total_count
    FROM v_appointment_details
    WHERE (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
      AND (p_patient_id IS NULL OR patient_id = p_patient_id)
      AND (p_status IS NULL OR status = p_status)
      AND (p_start_date IS NULL OR appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR appointment_date <= p_end_date)
      AND (
          p_search = '' 
          OR patient_name LIKE CONCAT('%', p_search, '%')
          OR patient_dni LIKE CONCAT('%', p_search, '%')
          OR patient_phone LIKE CONCAT('%', p_search, '%')
          OR reason LIKE CONCAT('%', p_search, '%')
      );

    
    SELECT *
    FROM v_appointment_details
    WHERE (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
      AND (p_patient_id IS NULL OR patient_id = p_patient_id)
      AND (p_status IS NULL OR status = p_status)
      AND (p_start_date IS NULL OR appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR appointment_date <= p_end_date)
      AND (
          p_search = '' 
          OR patient_name LIKE CONCAT('%', p_search, '%')
          OR patient_dni LIKE CONCAT('%', p_search, '%')
          OR patient_phone LIKE CONCAT('%', p_search, '%')
          OR reason LIKE CONCAT('%', p_search, '%')
      )
    ORDER BY appointment_date DESC
    LIMIT p_limit OFFSET v_offset;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_search_patients` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_search_patients`(
    IN  p_search    VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
    IN  p_page      INT,
    IN  p_limit     INT,
    IN  p_doctor_id INT,
    IN  p_role      VARCHAR(50),
    IN  p_user_id   INT,
    OUT p_total     INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_doctor_id_for_user INT DEFAULT NULL;

    SET v_offset = (COALESCE(p_page, 1) - 1) * COALESCE(p_limit, 50);

    IF p_role = 'doctor' THEN
        SELECT id INTO v_doctor_id_for_user
        FROM doctors
        WHERE user_id = p_user_id
        LIMIT 1;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS _tmp_patient_search;
    CREATE TEMPORARY TABLE _tmp_patient_search AS
    SELECT p.id
    FROM view_patients_extended p
    WHERE
        (p_role NOT IN ('doctor') OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = v_doctor_id_for_user
        ))
        AND (p_doctor_id IS NULL OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = p_doctor_id
        ))
        AND (
            p_search IS NULL OR p_search = ''
            OR p.full_name LIKE CONCAT('%', p_search, '%')
            OR p.dni LIKE CONCAT('%', p_search, '%')
            OR p.phone LIKE CONCAT('%', p_search, '%')
        );

    SELECT COUNT(*) INTO p_total FROM _tmp_patient_search;

    SELECT p.*
    FROM view_patients_extended p
    INNER JOIN _tmp_patient_search t ON t.id = p.id
    ORDER BY p.full_name ASC
    LIMIT p_limit OFFSET v_offset;

    DROP TEMPORARY TABLE IF EXISTS _tmp_patient_search;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_sync_appointment_payment_status` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_sync_appointment_payment_status`(
    IN p_appointment_id INT
)
BEGIN
    DECLARE v_cost           DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paid_amount    DECIMAL(10,2) DEFAULT 0;
    DECLARE v_pending_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_bonified_count INT DEFAULT 0;
    DECLARE v_total_rows     INT DEFAULT 0;
    DECLARE v_new_status     VARCHAR(50);
    DECLARE v_is_paid        TINYINT DEFAULT 0;

    
    SELECT COALESCE(cost, 0) INTO v_cost
    FROM appointments
    WHERE id = p_appointment_id;

    
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN method = 'bonified' OR amount = 0 THEN 1 ELSE 0 END), 0)
    INTO v_total_rows, v_paid_amount, v_pending_amount, v_bonified_count
    FROM transactions
    WHERE appointment_id = p_appointment_id;

    
    IF v_total_rows = 0 THEN
        SET v_new_status = 'pending';
        SET v_is_paid = 0;
    ELSEIF v_bonified_count = v_total_rows THEN
        SET v_new_status = 'paid';
        SET v_is_paid = 1;
    
    ELSEIF v_pending_amount > 0 THEN
        IF v_paid_amount > 0 THEN
            SET v_new_status = 'partial';
        ELSE
            SET v_new_status = 'debt';
        END IF;
        SET v_is_paid = 0;
    
    ELSEIF v_paid_amount >= v_cost THEN
        SET v_new_status = 'paid';
        SET v_is_paid = 1;
    ELSEIF v_paid_amount > 0 THEN
        SET v_new_status = 'partial';
        SET v_is_paid = 0;
    ELSE
        SET v_new_status = 'pending';
        SET v_is_paid = 0;
    END IF;

    UPDATE appointments
    SET
        payment_status = v_new_status,
        is_paid        = v_is_paid
    WHERE id = p_appointment_id;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_sync_rental_payment_status` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_sync_rental_payment_status`(
    IN p_rental_id INT
)
BEGIN
    DECLARE v_cost           DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paid_amount    DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_rows     INT DEFAULT 0;
    DECLARE v_is_paid        TINYINT DEFAULT 0;

    
    SELECT COALESCE(cost, 0) INTO v_cost
    FROM office_rentals
    WHERE id = p_rental_id;

    
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)
    INTO v_total_rows, v_paid_amount
    FROM transactions
    WHERE rental_id = p_rental_id;

    
    IF v_total_rows > 0 AND v_paid_amount >= v_cost THEN
        SET v_is_paid = 1;
    ELSE
        SET v_is_paid = 0;
    END IF;

    UPDATE office_rentals
    SET is_paid = v_is_paid
    WHERE id = p_rental_id;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_sync_request_payment_status` */;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_sync_request_payment_status`(
    IN p_request_id INT
)
BEGIN
    DECLARE v_total_amount   DECIMAL(15,2) DEFAULT 0;
    DECLARE v_paid_amount    DECIMAL(15,2) DEFAULT 0;
    DECLARE v_pending_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_bonified_count INT DEFAULT 0;
    DECLARE v_total_rows     INT DEFAULT 0;
    DECLARE v_new_status     VARCHAR(50);
    DECLARE v_debt_amount    DECIMAL(15,2) DEFAULT 0;

    SELECT
        COUNT(*)                                           INTO v_total_rows
    FROM transactions
    WHERE request_id = p_request_id;

    SELECT
        COALESCE(SUM(amount), 0)                           INTO v_total_amount
    FROM transactions
    WHERE request_id = p_request_id;

    SELECT
        COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN method = 'bonified' OR amount = 0 THEN 1 ELSE 0 END), 0)
    INTO v_paid_amount, v_pending_amount, v_bonified_count
    FROM transactions
    WHERE request_id = p_request_id;

    
    IF v_total_rows = 0 THEN
        SET v_new_status = 'pending';
        SET v_debt_amount = 0;
    ELSEIF v_bonified_count = v_total_rows THEN
        SET v_new_status = 'bonified';
        SET v_debt_amount = 0;
    ELSEIF v_pending_amount = 0 THEN
        SET v_new_status = 'paid';
        SET v_debt_amount = 0;
    ELSEIF v_paid_amount = 0 THEN
        SET v_new_status = 'debt';
        SET v_debt_amount = v_pending_amount;
    ELSE
        SET v_new_status = 'partial';
        SET v_debt_amount = v_pending_amount;
    END IF;

    UPDATE medical_requests
    SET
        payment_status = v_new_status,
        debt_amount    = v_debt_amount
    WHERE id = p_request_id;
END
;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `clinical_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

