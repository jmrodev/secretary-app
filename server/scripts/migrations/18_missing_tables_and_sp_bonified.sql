-- =============================================================================
-- Migration 18: Tablas y procedimiento faltantes
-- Creado: 2026-06-26
-- 1. whatsapp_messages     — mensajes entrantes/salientes de WhatsApp
-- 2. cash_box_balancings   — registros de arqueo de caja
-- 3. sp_mark_as_bonified   — bonifica las transacciones de un turno/receta
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. whatsapp_messages
--    Columnas inferidas de whatsappRepository.js:
--      patient_id    INT         — FK patients (puede ser NULL si aún no vinculado)
--      sender_phone  VARCHAR     — teléfono del que envió
--      direction     ENUM        — 'inbound' | 'outbound'
--      body          TEXT        — contenido del mensaje
--      whatsapp_id   VARCHAR     — ID único de WhatsApp (para dedup y status updates)
--      status        VARCHAR     — 'sent' | 'delivered' | 'read' | 'failed'
--      created_at    TIMESTAMP   — fecha de creación
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
    `id`           INT(11)      NOT NULL AUTO_INCREMENT,
    `patient_id`   INT(11)      DEFAULT NULL,
    `sender_phone` VARCHAR(50)  DEFAULT NULL,
    `direction`    ENUM('inbound','outbound') NOT NULL DEFAULT 'inbound',
    `body`         TEXT         DEFAULT NULL,
    `whatsapp_id`  VARCHAR(255) DEFAULT NULL,
    `status`       VARCHAR(50)  NOT NULL DEFAULT 'sent',
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_whatsapp_id` (`whatsapp_id`),
    KEY `idx_wm_patient`       (`patient_id`),
    KEY `idx_wm_sender_phone`  (`sender_phone`),
    KEY `idx_wm_created_at`    (`created_at`),
    CONSTRAINT `fk_wm_patient`
        FOREIGN KEY (`patient_id`)
        REFERENCES `patients` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ---------------------------------------------------------------------------
-- 2. cash_box_balancings
--    Columnas inferidas de financeService.js performBalancing():
--      doctor_id             INT          — doctor que cierra caja
--      balancing_date        DATE         — fecha del arqueo
--      theoretical_balance   DECIMAL      — saldo calculado por el sistema
--      physical_balance      DECIMAL      — saldo contado físicamente
--      difference            DECIMAL      — diferencia (físico - teórico)
--      notes                 TEXT         — observaciones
--      created_at            TIMESTAMP    — fecha de registro
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cash_box_balancings` (
    `id`                   INT(11)       NOT NULL AUTO_INCREMENT,
    `doctor_id`            INT(11)       DEFAULT NULL,
    `balancing_date`       DATE          NOT NULL,
    `theoretical_balance`  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `physical_balance`     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `difference`           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `notes`                TEXT          DEFAULT NULL,
    `created_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cb_doctor`   (`doctor_id`),
    KEY `idx_cb_date`     (`balancing_date`),
    CONSTRAINT `fk_cb_doctor`
        FOREIGN KEY (`doctor_id`)
        REFERENCES `doctors` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ---------------------------------------------------------------------------
-- 3. sp_mark_as_bonified
--    Marca como bonificadas todas las transacciones asociadas a un turno
--    o a una receta (type = 'appointment' | 'prescription').
--
--    Parámetros:
--      p_id    INT         — appointment_id o request_id
--      p_type  VARCHAR(50) — 'appointment' | 'prescription'
--
--    Lo que hace:
--      - Pone amount = 0, method = 'bonified', status = 'paid'
--        en todas las transacciones relacionadas.
--      - Si es appointment, también actualiza appointments.bonified = 1.
-- ---------------------------------------------------------------------------
DELIMITER //

CREATE OR REPLACE PROCEDURE sp_mark_as_bonified(
    IN p_id   INT,
    IN p_type VARCHAR(50)
)
BEGIN
    IF p_type = 'appointment' THEN
        UPDATE transactions
        SET
            amount  = 0,
            method  = 'bonified',
            status  = 'paid'
        WHERE appointment_id = p_id;

        -- Marcar el turno como bonificado
        UPDATE appointments
        SET bonified = 1
        WHERE id = p_id;

    ELSEIF p_type = 'prescription' THEN
        -- Las recetas guardan su vínculo financiero por request_id
        UPDATE transactions
        SET
            amount  = 0,
            method  = 'bonified',
            status  = 'paid'
        WHERE request_id = p_id;

    END IF;
END //

DELIMITER ;
