-- =============================================================================
-- Migration 22: Update sp_get_daily_schedule to select payment columns
-- Creado: 2026-06-26
-- =============================================================================

DELIMITER //

CREATE OR REPLACE PROCEDURE sp_get_daily_schedule(
    IN p_doctor_id INT,
    IN p_date_str VARCHAR(10)
)
BEGIN
    DECLARE v_duration INT;
    DECLARE v_overturn_start TIME;
    DECLARE v_overturn_end TIME;
    DECLARE v_force_alignment TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_slot_dur INT;
    DECLARE v_date DATE;
    DECLARE v_day_of_week INT;
    DECLARE v_is_holiday TINYINT DEFAULT 0;

    -- Temp table to store generated slots
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_slots;

    SET v_date = STR_TO_DATE(p_date_str, '%Y-%m-%d');
    SET v_day_of_week = DAYOFWEEK(v_date) - 1;

    -- Check if it is a holiday
    SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_date;

    -- Get doctor configuration
    SELECT 
        COALESCE(appointment_duration, 60), 
        COALESCE(overturn_start_time, '08:00:00'), 
        COALESCE(overturn_end_time, '21:00:00'),
        COALESCE(force_hour_alignment, 0)
    INTO 
        v_duration, 
        v_overturn_start, 
        v_overturn_end,
        v_force_alignment
    FROM doctors 
    WHERE id = p_doctor_id;

    SET v_current_time = v_overturn_start;

    -- Loop to generate time slots
    WHILE v_current_time < v_overturn_end DO
        SET v_slot_dur = v_duration;
        
        IF v_force_alignment = 1 AND (TIME_TO_SEC(v_current_time) % 3600) != 0 THEN
            SET v_slot_dur = 60 - ((TIME_TO_SEC(v_current_time) % 3600) / 60);
        END IF;

        IF TIME_TO_SEC(v_current_time) + (v_slot_dur * 60) > TIME_TO_SEC(v_overturn_end) THEN
            SET v_current_time = v_overturn_end;
        ELSE
            BEGIN
                DECLARE v_is_official TINYINT DEFAULT 0;
                DECLARE v_is_break TINYINT DEFAULT 0;
                DECLARE v_status VARCHAR(50);

                IF v_is_holiday = 1 THEN
                    SET v_status = 'closed_holiday';
                ELSE
                    -- Check if falls in official work schedules
                    SELECT COUNT(*) INTO v_is_official
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 0
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    -- Check if falls in break
                    SELECT COUNT(*) INTO v_is_break
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 1
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

                    IF v_is_break > 0 THEN
                        SET v_status = 'break';
                    ELSEIF v_is_official > 0 THEN
                        SET v_status = 'free';
                    ELSE
                        SET v_status = 'out_of_hours';
                    END IF;
                END IF;

                INSERT INTO temp_slots (slot_date, slot_time, slot_status, is_out_of_hours)
                VALUES (v_date, v_current_time, v_status, CASE WHEN v_status = 'out_of_hours' THEN 1 ELSE 0 END);
            END;

            SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_dur * 60));
        END IF;
    END WHILE;

    -- Select slot details joined with appointments including payment columns
    SELECT 
        a.id,
        a.appointment_date,
        p_doctor_id as doctor_id,
        d.full_name as doctor_name,
        a.patient_id,
        a.patient_name,
        a.patient_phone,
        a.status,
        a.reason,
        a.type,
        ts.is_out_of_hours,
        a.paid_amount,
        a.pending_amount,
        a.cost,
        a.payment_status,
        a.rescheduled_from_date,
        ts.slot_date,
        ts.slot_time,
        CASE 
            WHEN a.id IS NOT NULL THEN 'taken' 
            ELSE ts.slot_status 
        END as slot_status
    FROM temp_slots ts
    LEFT JOIN v_appointment_details a 
        ON a.doctor_id = p_doctor_id 
        AND DATE(a.appointment_date) = ts.slot_date 
        AND TIME(a.appointment_date) = ts.slot_time
        AND a.status NOT IN ('cancelled', 'suspended')
    LEFT JOIN doctors d ON d.id = p_doctor_id
    ORDER BY ts.slot_time;
END //

DELIMITER ;
