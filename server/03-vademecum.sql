-- Create Vademecum Table
CREATE TABLE IF NOT EXISTS `vademecum` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255),
  `presentacion` VARCHAR(255),
  `monodroga` VARCHAR(255),
  `laboratorio` VARCHAR(255),
  `vademecum_type` VARCHAR(100),
  `fcias_propias` VARCHAR(50),
  `fcias_convenidas` VARCHAR(50),
  `observaciones` TEXT,
  FULLTEXT idx_vademecum_search (nombre, monodroga, laboratorio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Patient Medications Table
CREATE TABLE IF NOT EXISTS `patient_medications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `medication_name` VARCHAR(255) NOT NULL,
  `presentation` VARCHAR(255),
  `monodroga` VARCHAR(255),
  `dose` VARCHAR(100),
  `frequency` VARCHAR(100),
  `is_chronic` TINYINT(1) DEFAULT 0,
  `status` ENUM('active', 'discontinued') DEFAULT 'active',
  `added_by` INT, 
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pm_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pm_added_by` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
