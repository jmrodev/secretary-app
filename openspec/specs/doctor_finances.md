# Specifications: Doctor Financial Ledger and Withdrawals

## Capability: doctor-finances

### Scenario 1: Doctor earns income from completed service
- **Given** an appointment with a total cost of $5000 assigned to a doctor
- **When** the service is rendered (`status = 'completed'`) and payment transactions are registered
- **Then** all transaction records (patient share and/or institution share) must contain the corresponding `doctor_id`
- **And** the total amount must be credited to that doctor's aggregate daily earnings

### Scenario 2: Doctor withdraws earnings (Cash Out / Payout)
- **Given** a doctor with a cash balance of $20000 in the clinic's ledger
- **When** the doctor performs a cash withdrawal of $8000
- **Then** a transaction must be created with `is_withdrawal = 1`, `status = 'paid'`, `amount = 8000`, and `method = 'cash'`
- **And** this withdrawal must contain the corresponding `doctor_id`
- **And** the doctor's aggregate cash balance for the day must be reduced to $12000

### Scenario 3: Daily balance rollup by method (Cash vs Transfer)
- **Given** a doctor with $15000 in cash transactions and $25000 in transfer transactions on the same day
- **When** querying `view_daily_balances` for that doctor and date
- **Then** the cash balance column must reflect exactly $15000
- **And** the transfer balance column must reflect exactly $25000
