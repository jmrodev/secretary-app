-- DB Optimization Migration: Patient Search Efficiency
-- Priority: Database Level Optimization (Architecture Rule 15.3)

-- 1. Standard B-Tree Indexes for fast lookups and sorting
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_dni ON patients(dni);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- 2. Full-Text Index for advanced multi-token searching
-- Note: Requires MyISAM or InnoDB (MariaDB supports FULLTEXT on both)
ALTER TABLE patients ADD FULLTEXT INDEX IF NOT EXISTS ft_idx_patient_search (full_name, dni, phone);
