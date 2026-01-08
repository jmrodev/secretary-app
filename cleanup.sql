-- Database Cleanup Script: CLEAR ALL TRANSACTIONS

-- 1. Clear ALL Audit Logs (Again, to be sure)
TRUNCATE TABLE audit_logs;

-- 2. Clear ALL Transactions (Wipe entire history)
TRUNCATE TABLE transactions;

-- 3. Reset Appointment Payment Statuses (Since payments are gone, appointments are no longer paid)
-- We set them back to 'pending' and is_paid = 0.
UPDATE appointments SET payment_status = 'pending', is_paid = 0;

-- 4. Optional: Clear google_sync_queue if relevant
TRUNCATE TABLE google_sync_queue;

SELECT "All Transactions Cleared and Appointments Reset." as Result;
