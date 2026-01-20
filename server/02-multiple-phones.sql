CREATE TABLE IF NOT EXISTS phone_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('patient', 'doctor', 'secretary', 'insurance', 'institution') NOT NULL,
    entity_id INT NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    label VARCHAR(50) DEFAULT 'Celular',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
