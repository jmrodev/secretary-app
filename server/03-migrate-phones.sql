-- Migration to migrate existing phones to the new phone_numbers table
INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label)
SELECT 'patient', id, phone, 1, 'Celular' FROM patients WHERE phone IS NOT NULL AND phone != '';

INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label)
SELECT 'doctor', id, phone, 1, 'Celular' FROM doctors WHERE phone IS NOT NULL AND phone != '';

INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label)
SELECT 'secretary', id, phone, 1, 'Celular' FROM secretaries WHERE phone IS NOT NULL AND phone != '';

INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label)
SELECT 'insurance', id, phone, 1, 'Celular' FROM insurances WHERE phone IS NOT NULL AND phone != '';
