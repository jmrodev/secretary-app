-- =============================================================================
-- Migration 26: Fix sp_search_patients - illegal mix of collations in LIKE
-- Creado: 2026-08-03
-- Refs: patientRepository, sp_search_patients, view_patients_extended
--
-- Problema:
--   El parámetro p_search se declaraba SIN colación explícita, por lo que
--   heredaba la colación por defecto de la base de datos (utf8mb4_unicode_ci),
--   mientras que las columnas de view_patients_extended (full_name, dni,
--   phone) son utf8mb4_general_ci. El operador LIKE lanzaba:
--     Error 1267: Illegal mix of collations (utf8mb4_general_ci,IMPLICIT)
--     and (utf8mb4_unicode_ci,IMPLICIT) for operation 'like'
--   Esto rompía GET /api/users/patients?search=... y por lo tanto la
--   búsqueda de pacientes en "Crear Turno".
--
-- Solución:
--   Declarar p_search con CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
--   para que coincida con la colación de las columnas buscadas.
-- =============================================================================

DELIMITER //

CREATE OR REPLACE PROCEDURE sp_search_patients(
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
END //

DELIMITER ;
