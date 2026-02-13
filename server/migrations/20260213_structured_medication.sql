-- Migration: Structured Medication
-- Description: Add vademecum_id to medications tables and create prescription_items

-- 1. Add vademecum_id to patient_medications
ALTER TABLE patient_medications ADD COLUMN vademecum_id INT DEFAULT NULL;
ALTER TABLE patient_medications ADD CONSTRAINT fk_pm_vademecum FOREIGN KEY (vademecum_id) REFERENCES vademecum(id) ON DELETE SET NULL;

-- 2. Add vademecum_id to medical_request_items
ALTER TABLE medical_request_items ADD COLUMN vademecum_id INT DEFAULT NULL;
ALTER TABLE medical_request_items ADD CONSTRAINT fk_mri_vademecum FOREIGN KEY (vademecum_id) REFERENCES vademecum(id) ON DELETE SET NULL;

-- 3. Create prescription_items table
CREATE TABLE IF NOT EXISTS prescription_items (
  id INT NOT NULL AUTO_INCREMENT,
  prescription_id INT NOT NULL,
  vademecum_id INT DEFAULT NULL,
  medication_name VARCHAR(255) NOT NULL, -- Keep name for redundancy/items not in vademecum
  presentation VARCHAR(255) DEFAULT NULL,
  monodroga VARCHAR(255) DEFAULT NULL,
  dose VARCHAR(100) DEFAULT NULL,
  frequency VARCHAR(100) DEFAULT NULL,
  duration VARCHAR(100) DEFAULT NULL,
  quantity INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pi_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_pi_vademecum FOREIGN KEY (vademecum_id) REFERENCES vademecum(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
