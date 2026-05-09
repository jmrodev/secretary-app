/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.6.25-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: localhost    Database: clinical_management
-- ------------------------------------------------------
-- Server version	10.6.25-MariaDB-ubu2204

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

--
-- Table structure for table `active_holidays`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appointments`
--

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
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `consultorio_id` (`consultorio_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`consultorio_id`) REFERENCES `consultorios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1025 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=7915 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consultorios`
--

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

--
-- Table structure for table `deleted_appointments`
--

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

--
-- Table structure for table `doctor_integrations`
--

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

--
-- Table structure for table `doctor_schedules`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=362 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doctors`
--

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
  `reminder_template` text DEFAULT NULL,
  `confirmation_template` text DEFAULT NULL,
  `reminder_virtual_template` text DEFAULT NULL,
  `confirmation_virtual_template` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `google_sync_queue`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=217 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `institutions`
--

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

--
-- Table structure for table `insurances`
--

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

--
-- Table structure for table `invoices`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_licenses`
--

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

--
-- Table structure for table `medical_request_items`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_requests`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `messages`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `office_rentals`
--

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

--
-- Table structure for table `overwritten_reservations`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_access_tokens`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_doctors`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_files`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_medications`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_statistics`
--

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

--
-- Table structure for table `patients`
--

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
  CONSTRAINT `fk_patient_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_patient_insurance` FOREIGN KEY (`insurance_id`) REFERENCES `insurances` (`id`) ON DELETE SET NULL,
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8664 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `phone_numbers`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=4367 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prescription_items`
--

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
  PRIMARY KEY (`id`),
  KEY `fk_pi_prescription` (`prescription_id`),
  KEY `fk_pi_vademecum` (`vademecum_id`),
  CONSTRAINT `fk_pi_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pi_vademecum` FOREIGN KEY (`vademecum_id`) REFERENCES `vademecum` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prescription_request_tokens`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prescriptions`
--

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

--
-- Table structure for table `recently_freed_slots`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=382 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recycle_bin`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `secretaries`
--

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

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transactions`
--

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
  PRIMARY KEY (`id`),
  KEY `related_user_id` (`related_user_id`),
  KEY `fk_trans_doctor` (`doctor_id`),
  KEY `request_id` (`request_id`),
  KEY `fk_transactions_appointment` (`appointment_id`),
  KEY `fk_transaction_institution` (`institution_id`),
  CONSTRAINT `fk_trans_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transaction_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`),
  CONSTRAINT `fk_transactions_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_request` FOREIGN KEY (`request_id`) REFERENCES `medical_requests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`related_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2242 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_typing_status`
--

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

--
-- Table structure for table `users`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=9718 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vademecum`
--

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

--
-- Table structure for table `whatsapp_messages`
--

DROP TABLE IF EXISTS `whatsapp_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) DEFAULT NULL,
  `sender_phone` varchar(20) DEFAULT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `body` text NOT NULL,
  `whatsapp_id` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'sent',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_wa_created` (`created_at`),
  KEY `idx_wa_status` (`status`),
  CONSTRAINT `whatsapp_messages_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-03  2:31:38
