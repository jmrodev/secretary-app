-- Migration 30: Update sp_search_patients to support server-side column sorting

DROP PROCEDURE IF EXISTS `sp_search_patients`;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_search_patients`(
    IN  p_search     VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
    IN  p_page       INT,
    IN  p_limit      INT,
    IN  p_doctor_id  INT,
    IN  p_role       VARCHAR(50),
    IN  p_user_id    INT,
    IN  p_sort_by    VARCHAR(50),
    IN  p_sort_order VARCHAR(10),
    OUT p_total      INT
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
    ORDER BY
        CASE WHEN p_sort_by = 'debt' AND (p_sort_order = 'DESC' OR p_sort_order = 'desc') THEN p.total_debt_calculated END DESC,
        CASE WHEN p_sort_by = 'debt' AND (p_sort_order = 'ASC' OR p_sort_order = 'asc') THEN p.total_debt_calculated END ASC,
        CASE WHEN p_sort_by = 'financial_rating' AND (p_sort_order = 'ASC' OR p_sort_order = 'asc') THEN p.financial_rating END ASC,
        CASE WHEN p_sort_by = 'financial_rating' AND (p_sort_order = 'DESC' OR p_sort_order = 'desc') THEN p.financial_rating END DESC,
        CASE WHEN p_sort_by = 'attendance_rating' AND (p_sort_order = 'ASC' OR p_sort_order = 'asc') THEN p.attendance_rating END ASC,
        CASE WHEN p_sort_by = 'attendance_rating' AND (p_sort_order = 'DESC' OR p_sort_order = 'desc') THEN p.attendance_rating END DESC,
        CASE WHEN p_sort_by = 'behavior_rating' AND (p_sort_order = 'ASC' OR p_sort_order = 'asc') THEN p.behavior_rating END ASC,
        CASE WHEN p_sort_by = 'behavior_rating' AND (p_sort_order = 'DESC' OR p_sort_order = 'desc') THEN p.behavior_rating END DESC,
        CASE WHEN p_sort_by = 'identification' AND (p_sort_order = 'DESC' OR p_sort_order = 'desc') THEN p.dni END DESC,
        CASE WHEN p_sort_by = 'identification' AND (p_sort_order = 'ASC' OR p_sort_order = 'asc') THEN p.dni END ASC,
        CASE WHEN p_sort_by = 'contact' AND (p_sort_order = 'DESC' OR p_sort_order = 'desc') THEN p.phone END DESC,
        CASE WHEN p_sort_by = 'contact' AND (p_sort_order = 'ASC' OR p_sort_order = 'asc') THEN p.phone END ASC,
        CASE WHEN (p_sort_by = 'patient' OR p_sort_by = 'name' OR p_sort_by IS NULL OR p_sort_by = '') AND (p_sort_order = 'DESC' OR p_sort_order = 'desc') THEN p.full_name END DESC,
        CASE WHEN (p_sort_by = 'patient' OR p_sort_by = 'name' OR p_sort_by IS NULL OR p_sort_by = '') AND (p_sort_order = 'ASC' OR p_sort_order = 'asc' OR p_sort_order IS NULL OR p_sort_order = '') THEN p.full_name END ASC,
        p.full_name ASC
    LIMIT p_limit OFFSET v_offset;

    DROP TEMPORARY TABLE IF EXISTS _tmp_patient_search;
END ;;
DELIMITER ;
