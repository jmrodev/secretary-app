-- =============================================================================
-- Migration 21: Make database payment status synchronization self-contained
-- Creado: 2026-06-26
-- =============================================================================

DELIMITER //

-- 1. Redefine trg_audit_transaction_insert to also handle automatic payment status sync
CREATE OR REPLACE TRIGGER trg_audit_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    -- Audit log
    INSERT INTO transaction_audits (transaction_id, action, new_amount, new_status, changed_at)
    VALUES (NEW.id, 'INSERT', NEW.amount, NEW.status, NOW());

    -- Payment status synchronization
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
END //

-- 2. Redefine trg_audit_transaction_update to also handle automatic payment status sync
CREATE OR REPLACE TRIGGER trg_audit_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    -- Audit log
    IF OLD.amount != NEW.amount OR OLD.status != NEW.status THEN
        INSERT INTO transaction_audits (transaction_id, action, old_amount, new_amount, old_status, new_status, changed_at)
        VALUES (NEW.id, 'UPDATE', OLD.amount, NEW.amount, OLD.status, NEW.status, NOW());
    END IF;

    -- Payment status synchronization for appointment_id
    IF NEW.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(NEW.appointment_id);
    END IF;
    IF OLD.appointment_id IS NOT NULL AND (NEW.appointment_id IS NULL OR OLD.appointment_id != NEW.appointment_id) THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;

    -- Payment status synchronization for rental_id
    IF NEW.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(NEW.rental_id);
    END IF;
    IF OLD.rental_id IS NOT NULL AND (NEW.rental_id IS NULL OR OLD.rental_id != NEW.rental_id) THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;

    -- Payment status synchronization for request_id
    IF NEW.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(NEW.request_id);
    END IF;
    IF OLD.request_id IS NOT NULL AND (NEW.request_id IS NULL OR OLD.request_id != NEW.request_id) THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END //

-- 3. Redefine trg_audit_transaction_delete to also handle automatic payment status sync
CREATE OR REPLACE TRIGGER trg_audit_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    -- Audit log
    INSERT INTO transaction_audits (transaction_id, action, old_amount, old_status, changed_at)
    VALUES (OLD.id, 'DELETE', OLD.amount, OLD.status, NOW());

    -- Payment status synchronization
    IF OLD.appointment_id IS NOT NULL THEN
        CALL sp_sync_appointment_payment_status(OLD.appointment_id);
    END IF;
    IF OLD.rental_id IS NOT NULL THEN
        CALL sp_sync_rental_payment_status(OLD.rental_id);
    END IF;
    IF OLD.request_id IS NOT NULL THEN
        CALL sp_sync_request_payment_status(OLD.request_id);
    END IF;
END //

DELIMITER ;
