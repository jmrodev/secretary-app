-- Optimization Migration: Daily Balance View and Indexing
-- Priority: Database Level (Architecture Rule 15.3)

-- 1. Optimized view for daily balances per doctor and payment method
CREATE OR REPLACE VIEW view_daily_balances AS
SELECT 
    DATE(t.transaction_date) as transaction_date,
    t.doctor_id,
    d.full_name as doctor_name,
    SUM(CASE WHEN t.method = 'cash' THEN 
        CASE WHEN t.is_withdrawal = 1 THEN -t.amount 
             WHEN (t.type LIKE 'income%' OR t.type = 'income') THEN t.amount 
             WHEN (t.type LIKE 'expense%' OR t.type = 'expense') THEN -t.amount 
             ELSE 0 END 
        ELSE 0 END) as cash_balance,
    SUM(CASE WHEN t.method != 'cash' THEN 
        CASE WHEN t.is_withdrawal = 1 THEN -t.amount 
             WHEN (t.type LIKE 'income%' OR t.type = 'income') THEN t.amount 
             WHEN (t.type LIKE 'expense%' OR t.type = 'expense') THEN -t.amount 
             ELSE 0 END 
        ELSE 0 END) as transfer_balance,
    MAX(t.transaction_date) as last_activity
FROM transactions t
LEFT JOIN doctors d ON t.doctor_id = d.id
WHERE t.status = 'paid'
GROUP BY DATE(t.transaction_date), t.doctor_id;

-- 2. Indexes for financial performance
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_finance_reconcile (transaction_date, status, doctor_id, method);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_patient_debt (related_user_id, status, amount);

-- 3. Audit Table for Transactions (Traceability)
CREATE TABLE IF NOT EXISTS transaction_audits (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    action ENUM('INSERT', 'UPDATE', 'DELETE'),
    old_amount DECIMAL(15,2),
    new_amount DECIMAL(15,2),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by_user_id INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit Triggers
DELIMITER //

CREATE TRIGGER trg_audit_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO transaction_audits (transaction_id, action, new_amount, new_status, changed_at)
    VALUES (NEW.id, 'INSERT', NEW.amount, NEW.status, NOW());
END; //

CREATE TRIGGER trg_audit_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    IF OLD.amount != NEW.amount OR OLD.status != NEW.status THEN
        INSERT INTO transaction_audits (transaction_id, action, old_amount, new_amount, old_status, new_status, changed_at)
        VALUES (NEW.id, 'UPDATE', OLD.amount, NEW.amount, OLD.status, NEW.status, NOW());
    END IF;
END; //

CREATE TRIGGER trg_audit_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO transaction_audits (transaction_id, action, old_amount, old_status, changed_at)
    VALUES (OLD.id, 'DELETE', OLD.amount, OLD.status, NOW());
END; //

DELIMITER ;
