-- =============================================================================
-- Migration 24: Fix sp_search_patients - remove FULLTEXT MATCH on views
-- Creado: 2026-07-28
-- Refs: patientRepository, sp_search_patients
--
-- Problema:
--   MATCH(p.full_name, p.dni, p.phone) AGAINST (... IN BOOLEAN MODE) no
--   funciona correctamente sobre view_patients_extended porque MariaDB no
--   puede resolver el índice FULLTEXT a través de la view cuando se usa
--   un alias distinto al de la tabla base.
--
--   Esto causa que búsquedas con nombre completo como "juan marcel rodriguez"
--   no encuentren resultados, porque el FULLTEXT falla silenciosamente y
--   el OR con LIKE nunca se evalúa correctamente.
--
-- Solución:
--   Eliminar MATCH ... AGAINST y usar solo LIKE, que es más predecible,
--   no necesita índice FULLTEXT, y funciona correctamente con vistas.
--   LIKE CONCAT('%', p_search, '%') ya cubre búsqueda parcial en cualquier
--   parte del nombre, DNI o teléfono.
-- =============================================================================

DELIMITER //

CREATE OR REPLACE PROCEDURE sp_search_patients(
    IN  p_search    VARCHAR(255),
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

    -- Si el rol es 'doctor', resolvemos qué doctor_id le pertenece
    IF p_role = 'doctor' THEN
        SELECT id INTO v_doctor_id_for_user
        FROM doctors
        WHERE user_id = p_user_id
        LIMIT 1;
    END IF;

    -- Crear tabla temporal con el universo filtrado (sin paginación)
    DROP TEMPORARY TABLE IF EXISTS _tmp_patient_search;
    CREATE TEMPORARY TABLE _tmp_patient_search AS
    SELECT p.id
    FROM view_patients_extended p
    WHERE
        -- Filtro de rol: si es doctor sólo ve sus pacientes
        (p_role NOT IN ('doctor') OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = v_doctor_id_for_user
        ))
        -- Filtro adicional por doctor_id explícito
        AND (p_doctor_id IS NULL OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = p_doctor_id
        ))
        -- Búsqueda por texto (solo LIKE - más predecible que FULLTEXT en vistas)
        AND (
            p_search IS NULL OR p_search = ''
            OR p.full_name LIKE CONCAT('%', p_search, '%')
            OR p.dni LIKE CONCAT('%', p_search, '%')
            OR p.phone LIKE CONCAT('%', p_search, '%')
        );

    -- Total de resultados
    SELECT COUNT(*) INTO p_total FROM _tmp_patient_search;

    -- Resultados paginados
    SELECT p.*
    FROM view_patients_extended p
    INNER JOIN _tmp_patient_search t ON t.id = p.id
    ORDER BY p.full_name ASC
    LIMIT p_limit OFFSET v_offset;

    DROP TEMPORARY TABLE IF EXISTS _tmp_patient_search;
END //

DELIMITER ;