-- =============================================================================
-- Migration 17: Stored procedures faltantes en la BD
-- Creado: 2026-06-26
-- Refs: patientRepository, patientService, financeService
-- =============================================================================

DELIMITER //

-- ---------------------------------------------------------------------------
-- 1. sp_search_patients
--    Parámetros (en orden exacto que llama el backend):
--      p_search      VARCHAR  — texto libre (nombre, DNI, teléfono)
--      p_page        INT      — página (1-based)
--      p_limit       INT      — registros por página
--      p_doctor_id   INT      — filtro por doctor asignado (NULL = todos)
--      p_role        VARCHAR  — rol del usuario que busca
--      p_user_id     INT      — id del usuario que busca
--      OUT p_total   INT      — total de registros sin paginar
--
--    Reglas de negocio:
--      - role='doctor': sólo muestra pacientes asignados a ese doctor
--      - role='admin'|'secretary': muestra todos
--      - busca en full_name, dni, phone (usa el índice FULLTEXT si hay término)
--      - ordena por full_name ASC
-- ---------------------------------------------------------------------------
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
        -- Búsqueda por texto
        AND (
            p_search IS NULL OR p_search = ''
            OR MATCH(p.full_name, p.dni, p.phone) AGAINST (p_search IN BOOLEAN MODE)
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


-- ---------------------------------------------------------------------------
-- 2. sp_get_search_suggestions
--    Devuelve hasta 10 pacientes recientes como sugerencias rápidas.
--    Parámetros:
--      p_user_id  INT         — id del usuario
--      p_role     VARCHAR(50) — rol del usuario
--
--    Si es doctor, sólo retorna sus propios pacientes.
--    Ordena por última actividad DESC.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_get_search_suggestions(
    IN p_user_id INT,
    IN p_role    VARCHAR(50)
)
BEGIN
    DECLARE v_doctor_id INT DEFAULT NULL;

    IF p_role = 'doctor' THEN
        SELECT id INTO v_doctor_id
        FROM doctors
        WHERE user_id = p_user_id
        LIMIT 1;
    END IF;

    SELECT
        p.id,
        p.full_name,
        p.dni,
        p.phone,
        p.total_debt_calculated,
        p.debt_status,
        p.last_activity
    FROM view_recent_patients p
    WHERE
        p_role NOT IN ('doctor')
        OR p.id IN (
            SELECT patient_id FROM patient_doctors WHERE doctor_id = v_doctor_id
        )
    ORDER BY p.last_activity DESC
    LIMIT 10;
END //


-- ---------------------------------------------------------------------------
-- 3. sp_sync_request_payment_status
--    Recalcula y actualiza el payment_status de una medical_request
--    según las transacciones asociadas.
--    Parámetros:
--      p_request_id INT — id de la medical_request a sincronizar
--
--    Lógica:
--      - Sin transacciones               → 'pending'
--      - Todas bonified/amount=0        → 'bonified'
--      - Todas paid                     → 'paid'
--      - Alguna pending, alguna paid    → 'partial'
--      - Todas pending                  → 'debt'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_sync_request_payment_status(
    IN p_request_id INT
)
BEGIN
    DECLARE v_total_amount   DECIMAL(15,2) DEFAULT 0;
    DECLARE v_paid_amount    DECIMAL(15,2) DEFAULT 0;
    DECLARE v_pending_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_bonified_count INT DEFAULT 0;
    DECLARE v_total_rows     INT DEFAULT 0;
    DECLARE v_new_status     VARCHAR(50);
    DECLARE v_debt_amount    DECIMAL(15,2) DEFAULT 0;

    SELECT
        COUNT(*)                                           INTO v_total_rows
    FROM transactions
    WHERE request_id = p_request_id;

    SELECT
        COALESCE(SUM(amount), 0)                           INTO v_total_amount
    FROM transactions
    WHERE request_id = p_request_id;

    SELECT
        COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN method = 'bonified' OR amount = 0 THEN 1 ELSE 0 END), 0)
    INTO v_paid_amount, v_pending_amount, v_bonified_count
    FROM transactions
    WHERE request_id = p_request_id;

    -- Determinar nuevo status
    IF v_total_rows = 0 THEN
        SET v_new_status = 'pending';
        SET v_debt_amount = 0;
    ELSEIF v_bonified_count = v_total_rows THEN
        SET v_new_status = 'bonified';
        SET v_debt_amount = 0;
    ELSEIF v_pending_amount = 0 THEN
        SET v_new_status = 'paid';
        SET v_debt_amount = 0;
    ELSEIF v_paid_amount = 0 THEN
        SET v_new_status = 'debt';
        SET v_debt_amount = v_pending_amount;
    ELSE
        SET v_new_status = 'partial';
        SET v_debt_amount = v_pending_amount;
    END IF;

    UPDATE medical_requests
    SET
        payment_status = v_new_status,
        debt_amount    = v_debt_amount
    WHERE id = p_request_id;
END //

DELIMITER ;
