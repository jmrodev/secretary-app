-- Optimization Migration: Financial Health Metrics
-- Priority: Database Level (Architecture Rule 15.3)

CREATE OR REPLACE VIEW view_doctor_financial_health AS
SELECT 
    d.id as doctor_id,
    d.full_name as doctor_name,
    COALESCE(SUM(CASE WHEN t.status = 'paid' AND t.is_withdrawal = 0 THEN t.amount ELSE 0 END), 0) as total_collected,
    COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as total_debt,
    CASE 
        WHEN SUM(CASE WHEN t.is_withdrawal = 0 THEN t.amount ELSE 0 END) = 0 THEN 100
        ELSE (SUM(CASE WHEN t.status = 'paid' AND t.is_withdrawal = 0 THEN t.amount ELSE 0 END) / 
              SUM(CASE WHEN t.is_withdrawal = 0 THEN t.amount ELSE 0 END)) * 100 
    END as collection_rate_percent,
    -- Average days to pay (using the audit log for the 'paid' transition)
    (SELECT AVG(DATEDIFF(ta.changed_at, t2.transaction_date))
     FROM transaction_audits ta
     JOIN transactions t2 ON ta.transaction_id = t2.id
     WHERE t2.doctor_id = d.id 
       AND ta.new_status = 'paid' 
       AND ta.old_status = 'pending'
    ) as avg_days_to_collect
FROM doctors d
LEFT JOIN transactions t ON d.id = t.doctor_id
GROUP BY d.id;
