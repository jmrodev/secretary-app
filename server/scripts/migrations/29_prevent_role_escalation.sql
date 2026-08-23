-- Migration 29: Prevent role escalation to admin via SQL UPDATE
-- A row can only be born as 'admin' (INSERT). Any attempt to change
-- an existing non-admin user's role to 'admin' is rejected at the DB level.
-- This is a defense-in-depth layer below the application service/repo guards.

DROP TRIGGER IF EXISTS trg_prevent_role_escalation;

DELIMITER $$

CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.role != 'admin' AND NEW.role = 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Role escalation to admin is not allowed via UPDATE.';
    END IF;
END$$

DELIMITER ;
