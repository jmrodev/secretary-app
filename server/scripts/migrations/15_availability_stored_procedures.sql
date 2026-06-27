-- Migration 15: Availability and Search Stored Procedures
-- Goal: Recreate missing database procedures sp_search_appointments, sp_get_daily_schedule, and sp_get_free_slots.

DELIMITER //

-- 1. Search Appointments Procedure
CREATE OR REPLACE PROCEDURE sp_search_appointments(
    IN p_search VARCHAR(255),
    IN p_doctor_id INT,
    IN p_patient_id INT,
    IN p_status VARCHAR(50),
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_page INT,
    IN p_limit INT,
    OUT p_total_count INT
)
BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;

    -- Calculate total count
    SELECT COUNT(*) INTO p_total_count
    FROM v_appointment_details
    WHERE (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
      AND (p_patient_id IS NULL OR patient_id = p_patient_id)
      AND (p_status IS NULL OR status = p_status)
      AND (p_start_date IS NULL OR appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR appointment_date <= p_end_date)
      AND (
          p_search = '' 
          OR patient_name LIKE CONCAT('%', p_search, '%')
          OR patient_dni LIKE CONCAT('%', p_search, '%')
          OR patient_phone LIKE CONCAT('%', p_search, '%')
          OR reason LIKE CONCAT('%', p_search, '%')
      );

    -- Select page of results
    SELECT *
    FROM v_appointment_details
    WHERE (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
      AND (p_patient_id IS NULL OR patient_id = p_patient_id)
      AND (p_status IS NULL OR status = p_status)
      AND (p_start_date IS NULL OR appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR appointment_date <= p_end_date)
      AND (
          p_search = '' 
          OR patient_name LIKE CONCAT('%', p_search, '%')
          OR patient_dni LIKE CONCAT('%', p_search, '%')
          OR patient_phone LIKE CONCAT('%', p_search, '%')
          OR reason LIKE CONCAT('%', p_search, '%')
      )
    ORDER BY appointment_date DESC
    LIMIT p_limit OFFSET v_offset;
END //

-- 2. Daily Schedule Slots Generation Procedure
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
    SET v_day_of_week = DAYOFWEEK(v_date) - 1; -- DAYOFWEEK returns 1 for Sunday, 2 for Monday, etc. So 0 for Sunday, 1 for Monday...

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

    -- Select slot details joined with appointments
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

-- 3. Free Slots Generation Procedure
CREATE OR REPLACE PROCEDURE sp_get_free_slots(
    IN p_doctor_id INT,
    IN p_start_date_str VARCHAR(10),
    IN p_days_to_check INT,
    IN p_include_out_of_hours INT
)
BEGIN
    DECLARE v_days_counter INT DEFAULT 0;
    DECLARE v_current_date DATE;
    DECLARE v_duration INT;
    DECLARE v_overturn_start TIME;
    DECLARE v_overturn_end TIME;
    DECLARE v_force_alignment TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_slot_dur INT;
    DECLARE v_day_of_week INT;
    DECLARE v_is_holiday TINYINT;

    -- Temp table to store all generated slots across the date range
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_all_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_break TINYINT,
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_all_slots;

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

    -- Loop through each day
    WHILE v_days_counter < p_days_to_check DO
        SET v_current_date = DATE_ADD(STR_TO_DATE(p_start_date_str, '%Y-%m-%d'), INTERVAL v_days_counter DAY);
        SET v_day_of_week = DAYOFWEEK(v_current_date) - 1;

        -- Check if holiday
        SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_current_date;

        IF v_is_holiday = 0 THEN
            SET v_current_time = v_overturn_start;

            -- Generate slots for the day
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

                        -- Check official schedule
                        SELECT COUNT(*) INTO v_is_official
                        FROM doctor_schedules
                        WHERE doctor_id = p_doctor_id
                          AND day_of_week = v_day_of_week
                          AND is_break = 0
                          AND v_current_time >= start_time
                          AND v_current_time < end_time;

                        -- Check break
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

                        -- Insert only if it's a valid slot to show
                        IF v_status = 'free' OR v_status = 'break' OR (p_include_out_of_hours = 1 AND v_status = 'out_of_hours') THEN
                            INSERT INTO temp_all_slots (slot_date, slot_time, slot_status, is_break, is_out_of_hours)
                            VALUES (v_current_date, v_current_time, v_status, CASE WHEN v_status = 'break' THEN 1 ELSE 0 END, CASE WHEN v_status = 'out_of_hours' THEN 1 ELSE 0 END);
                        END IF;
                    END;

                    SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_dur * 60));
                END IF;
            END WHILE;
        END IF;

        SET v_days_counter = v_days_counter + 1;
    END WHILE;

    -- Return free slots (no overlapping appointments)
    SELECT 
        ts.slot_date as date,
        TIME_FORMAT(ts.slot_time, '%H:%i') as time,
        CONCAT(ts.slot_date, 'T', ts.slot_time, '-03:00') as iso,
        ts.is_break,
        ts.is_out_of_hours
    FROM temp_all_slots ts
    LEFT JOIN appointments a 
        ON a.doctor_id = p_doctor_id 
        AND DATE(a.appointment_date) = ts.slot_date 
        AND TIME(a.appointment_date) = ts.slot_time
        AND a.status NOT IN ('cancelled', 'suspended')
    WHERE a.id IS NULL
      AND ts.slot_status != 'break'
    ORDER BY ts.slot_date, ts.slot_time;
END //

DELIMITER ;
