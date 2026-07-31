-- =============================================================================
-- Migration 25: Supervised WhatsApp auto-booking — pending bookings table
-- Creado: 2026-07-30
-- Refs: whatsappAiService._tryAutoBook(), pendingBookingRepository,
--       whatsappController (accept/suggest/reject pending)
--
-- Objetivo:
--   El AI ya NO crea turnos directamente. Cuando un paciente confirma un
--   horario, se inserta una fila en whatsapp_pending_bookings (status
--   'pending') que la Secretaría debe aprobar. Recién al aceptar se llama a
--   sp_book_appointment. Tambien se agrega doctors.pending_response_template
--   para personalizar la respuesta del AI mientras existe un pedido pendiente.
--
-- Rollback:
--   DROP TABLE IF EXISTS whatsapp_pending_bookings;
--   ALTER TABLE doctors DROP COLUMN pending_response_template;
-- =============================================================================

CREATE TABLE IF NOT EXISTS `whatsapp_pending_bookings` (
    `id`                    INT(11)       NOT NULL AUTO_INCREMENT,
    `patient_id`            INT(11)       NOT NULL,
    `doctor_id`             INT(11)       NOT NULL,
    `patient_phone`         VARCHAR(50)   NOT NULL,
    `requested_slot_date`   DATE          NOT NULL,
    `requested_slot_time`   VARCHAR(5)    NOT NULL,
    `status`                ENUM('pending','accepted','rejected','alternative_sent','alternative_accepted','alternative_rejected','timed_out') NOT NULL DEFAULT 'pending',
    `accepted_by`           INT(11)       DEFAULT NULL,
    `accepted_at`           TIMESTAMP     NULL DEFAULT NULL,
    `alternative_slot_iso`  VARCHAR(30)   DEFAULT NULL,
    `alternative_note`      TEXT          DEFAULT NULL,
    `alternative_sent_at`   TIMESTAMP     NULL DEFAULT NULL,
    `rejected_by`           INT(11)       DEFAULT NULL,
    `rejected_reason`       VARCHAR(255)  DEFAULT NULL,
    `appointment_id`        INT(11)       DEFAULT NULL,
    `created_at`            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_wpb_status`       (`status`),
    KEY `idx_wpb_patient`      (`patient_id`),
    KEY `idx_wpb_doctor`       (`doctor_id`),
    KEY `idx_wpb_phone`        (`patient_phone`),
    CONSTRAINT `fk_wpb_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wpb_doctor`  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Template configurable del AI para responder mientras el pedido está pendiente
ALTER TABLE `doctors`
    ADD COLUMN `pending_response_template` TEXT DEFAULT NULL
    AFTER `gemini_api_version`;
