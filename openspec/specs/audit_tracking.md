# Specifications: User Traceability and Transaction Audits

## Capability: audit-tracking

### Scenario 1: Appointment creator is tracked (created_by)
- **Given** an active session for a secretary or doctor with user ID 5
- **When** the user creates an appointment through the system
- **Then** the service must pass the user ID as `created_by` to the stored procedure `sp_book_appointment`
- **And** the appointment record in the database must store the creator's user ID in the `created_by` column for auditing

### Scenario 2: Transaction auditing on updates
- **Given** an existing transaction in the database
- **When** the amount or status of the transaction is updated
- **Then** the database trigger `trg_audit_transaction_update` must automatically insert an audit record into the `transaction_audits` table
- **And** the audit record must record the `action = 'UPDATE'`, the old and new amounts, the old and new statuses, and the changed timestamp
