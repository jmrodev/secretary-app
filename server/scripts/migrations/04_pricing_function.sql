-- Optimization Migration: Centralized Pricing & Finance Logic
-- Priority: Database Level (Architecture Rule 15.3)
-- This migration implements a deterministic pricing function in MariaDB.

DELIMITER //

CREATE OR REPLACE FUNCTION fn_calculate_service_price(
    p_doctor_id INT,
    p_patient_id INT,
    p_service_type VARCHAR(50),
    p_institution_id INT
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_base_price DECIMAL(10,2) DEFAULT 0;
    DECLARE v_final_price DECIMAL(10,2) DEFAULT 0;
    DECLARE v_tariff_percent INT DEFAULT 0;
    DECLARE v_tariff_override DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_inst_price DECIMAL(10,2) DEFAULT 0;

    -- 1. Get Doctor's Base Price
    SELECT 
        CASE p_service_type
            WHEN 'prescription' THEN COALESCE(prescription_price, 0)
            WHEN 'medical_license' THEN COALESCE(medical_license_price, 0)
            WHEN 'certificate' THEN COALESCE(certificate_price, 0)
            WHEN 'virtual_consultation' THEN COALESCE(virtual_consultation_price, 0)
            ELSE COALESCE(consultation_price, 0)
        END INTO v_base_price
    FROM doctors WHERE id = p_doctor_id;

    -- 2. Get Institution Price if provided (override base)
    IF p_institution_id IS NOT NULL THEN
        SELECT COALESCE(base_price, 0) INTO v_inst_price FROM institutions WHERE id = p_institution_id;
    END IF;

    -- 3. Get Patient Data
    IF p_patient_id IS NOT NULL THEN
        SELECT COALESCE(tariff_percent, 0), tariff_override 
        INTO v_tariff_percent, v_tariff_override
        FROM patients WHERE id = p_patient_id;
    END IF;

    -- 4. Logic Calculation
    SET v_final_price = v_base_price;
    
    IF v_inst_price > 0 THEN
        SET v_base_price = v_inst_price;
        SET v_final_price = 0; -- Initial share is covered by institution
    END IF;

    -- Apply Override (only for standard consultation)
    IF v_tariff_override > 0 AND (p_service_type = 'consultation' OR p_service_type IS NULL OR p_service_type = '') THEN
        SET v_final_price = v_tariff_override;
    ELSEIF v_tariff_percent != 0 THEN
        -- Apply Adjustment Percent over the active Base Price
        SET v_final_price = v_final_price + (v_base_price * (v_tariff_percent / 100));
    END IF;

    RETURN v_final_price;
END //

DELIMITER ;
