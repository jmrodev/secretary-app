# Specifications: FIFO Debt Settlement and Advance Payments

## Capability: debt-settlement

### Scenario 1: Patient fully pays off multiple pending debts (FIFO)
- **Given** a patient with two pending transactions: Transaction A ($2000, oldest) and Transaction B ($3000)
- **When** the patient registers a payment of $5000 via `payDebt`
- **Then** the database procedure must update Transaction A to `status = 'paid'` and amount $2000
- **And** update Transaction B to `status = 'paid'` and amount $3000
- **And** no remaining balance or pending transactions must be created

### Scenario 2: Patient makes a partial payment on the oldest debt (FIFO)
- **Given** a patient with one pending transaction of $5000
- **When** the patient registers a payment of $3000
- **Then** the database procedure must update the existing transaction to `amount = 3000`, `status = 'paid'`, and append `- PARTIAL PAID` to the description
- **And** it must insert a new pending transaction (`status = 'pending'`, `method = 'on_account'`) of $2000 representing the remaining unpaid balance

### Scenario 3: Patient pays more than their total debt (Advance Payment / Credit Balance)
- **Given** a patient with a single pending transaction of $4000
- **When** the patient registers a payment of $6000
- **Then** the database procedure must update the pending transaction of $4000 to `status = 'paid'`
- **And** it must insert a new paid transaction of $2000 (`status = 'paid'`) with description `'Advance Payment / Credit Balance'` representing a credit balance in the patient's favor
