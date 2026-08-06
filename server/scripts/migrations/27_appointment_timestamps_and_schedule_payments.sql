-- =============================================================================
-- Migration 27: Apply pending timestamp columns from migration 19 and
--               schedule payment columns from migration 22
-- Creado: 2026-08-03
-- Refs: appointments, v_appointment_details, sp_get_daily_schedule
--
-- Contexto:
--   La base de datos del entorno de test quedó en un estado mezclado:
--   se aplicaron las migraciones 20, 23, 24 y 25, pero NO la 19
--   (appointment_timestamps) ni la 22 (schedule payment columns).
--
--   Esto provocaba:
--     Error 1054: Unknown column 'confirmed_at' in 'SET'  (modificationService)
--     Error 1054: Unknown column 'paid_at' in 'WHERE'     (financeService)
--   al confirmar un turno o un pago desde la UI.
--
--   NO se re-aplica la migración 19 completa porque redefine
--   sp_create_transaction sin la columna rental_id (agregada en la 20).
-- =============================================================================

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS confirmed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS arrived_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS paid_at DATETIME NULL;

-- ---------------------------------------------------------------------------
-- Update View v_appointment_details to include timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_appointment_details AS
SELECT 
    a.id,
    a.appointment_date,
    a.reason,
    a.status,
    a.payment_status,
    a.type,
    a.is_out_of_hours,
    a.bonified,
    a.cost,
    a.google_event_id,
    a.rescheduled_from_date,
    a.duration,
    a.created_at,
    a.confirmed_at,
    a.arrived_at,
    a.completed_at,
    a.paid_at,
    a.patient_id,
    p.full_name AS patient_name,
    p.dni AS patient_dni,
    p.phone AS patient_phone,
    p.behavior_rating,
    a.doctor_id,
    d.full_name AS doctor_name,
    d.afip_cuit AS doctor_cuit,
    a.institution_id,
    inst.name AS institution_name,
    inst.base_price AS institution_base_price,
    COALESCE(tx.paid_amount, 0) AS paid_amount,
    COALESCE(tx.pending_amount, 0) AS pending_amount,
    inv.invoice_number,
    inv.invoice_punto_vta,
    inv.invoice_cae,
    (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = a.patient_id AND a2.status IN ('attended', 'completed')) as attended_appointments
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN institutions inst ON a.institution_id = inst.id
LEFT JOIN (
    SELECT 
        appointment_id,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount
    FROM transactions
    WHERE is_withdrawal = 0
    GROUP BY appointment_id
) tx ON tx.appointment_id = a.id
LEFT JOIN (
    SELECT 
        t.appointment_id,
        MIN(i.cbte_nro) AS invoice_number,
        MIN(i.punto_vta) AS invoice_punto_vta,
        MIN(i.cae) AS invoice_cae
    FROM invoices i
    JOIN transactions t ON i.transaction_id = t.id
    WHERE t.appointment_id IS NOT NULL
    GROUP BY t.appointment_id
) inv ON inv.appointment_id = a.id;

-- ---------------------------------------------------------------------------
-- Update sp_get_daily_schedule to include payment columns (migration 22)
-- ---------------------------------------------------------------------------
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

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_slots (
        slot_date DATE,
        slot_time TIME,
        slot_status VARCHAR(50),
        is_out_of_hours TINYINT
    );
    TRUNCATE temp_slots;

    SET v_date = STR_TO_DATE(p_date_str, '%Y-%m-%d');
    SET v_day_of_week = DAYOFWEEK(v_date) - 1;

    SELECT COUNT(*) INTO v_is_holiday FROM active_holidays WHERE date = v_date;

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
                    SELECT COUNT(*) INTO v_is_official
                    FROM doctor_schedules
                    WHERE doctor_id = p_doctor_id
                      AND day_of_week = v_day_of_week
                      AND is_break = 0
                      AND v_current_time >= start_time
                      AND v_current_time < end_time;

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
        a.created_at,
        a.confirmed_at,
        a.arrived_at,
        a.completed_at,
        a.paid_at,
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
