-- Migration 13: Daily Financial Summary View
-- Goal: Centralize financial report calculations in SQL (SQL-First principle).

CREATE OR REPLACE VIEW view_daily_financial_summary AS
SELECT 
    DATE(transaction_date) as report_date,
    doctor_id,
    SUM(CASE WHEN is_withdrawal = 0 AND status = 'paid' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN is_withdrawal = 0 AND status = 'paid' AND (method = 'cash' OR method = 'efectivo') THEN amount ELSE 0 END) as total_cash,
    SUM(CASE WHEN is_withdrawal = 1 AND status = 'paid' THEN amount ELSE 0 END) as total_withdrawal
FROM transactions
GROUP BY DATE(transaction_date), doctor_id;
