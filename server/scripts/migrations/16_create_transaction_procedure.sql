-- Migration 16: Stored Procedure for Transaction Creation
-- Provides atomic INSERT into transactions table.
-- p_idempotency_key is accepted for API compatibility but not stored (column doesn't exist yet).

DELIMITER //

CREATE OR REPLACE PROCEDURE sp_create_transaction(
    IN  p_type             VARCHAR(50),
    IN  p_amount           DECIMAL(10,2),
    IN  p_method           VARCHAR(50),
    IN  p_description      VARCHAR(255),
    IN  p_doctor_id        INT,
    IN  p_status           VARCHAR(50),
    IN  p_is_withdrawal    TINYINT(1),
    IN  p_related_user_id  INT,
    IN  p_transaction_date TIMESTAMP,
    IN  p_appointment_id   INT,
    IN  p_request_id       INT,
    IN  p_idempotency_key  VARCHAR(100),
    OUT p_id               INT
)
BEGIN
    INSERT INTO transactions (
        type,
        amount,
        method,
        description,
        doctor_id,
        status,
        is_withdrawal,
        related_user_id,
        transaction_date,
        appointment_id,
        request_id
    ) VALUES (
        p_type,
        p_amount,
        COALESCE(p_method,  'cash'),
        p_description,
        p_doctor_id,
        COALESCE(p_status,  'paid'),
        COALESCE(p_is_withdrawal, 0),
        p_related_user_id,
        COALESCE(p_transaction_date, NOW()),
        p_appointment_id,
        p_request_id
    );

    SET p_id = LAST_INSERT_ID();
END //

DELIMITER ;
