-- Migration 12: Add Fulltext search index to patients
-- Goal: Fix patient search functionality which depends on MATCH AGAINST.

ALTER TABLE patients ADD FULLTEXT INDEX IF NOT EXISTS idx_patients_search (full_name, dni, phone);
