# Specifications: Appointment Pricing and Transaction Generation

## Capability: appointment-pricing

### Scenario 1: Patient books a standard consultation (No Insurance/Institution)
- **Given** a doctor with a standard consultation rate of $5000
- **And** a patient with no active health insurance
- **When** an appointment is booked via `sp_book_appointment` with `bonified = 0` and `institution_id = NULL`
- **Then** the appointment `cost` must be set to $5000
- **And** a pending transaction (`status = 'pending'`) of $5000 must be generated for the patient
- **And** the appointment `payment_status` must be initialized to `debt`

### Scenario 2: Patient books a bonified appointment
- **Given** an appointment is booked with `bonified = 1`
- **When** the transaction is processed
- **Then** the appointment `cost` must be set to $0
- **And** a transaction of $0 with `status = 'paid'` and `method = 'bonified'` must be generated automatically
- **And** the appointment `payment_status` must be set to `paid`

### Scenario 3: Patient books an appointment under an Institution/Insurance co-payment
- **Given** an institution with a base consultation rate of $6000
- **And** a patient whose insurance co-payment rate for the doctor is $2000
- **When** the appointment is booked with the corresponding `institution_id`
- **Then** a pending transaction of $2000 must be created for the patient (`status = 'pending'`, `method = 'on_account'`)
- **And** a pending transaction of $4000 ($6000 - $2000) must be created for the institution
- **And** the appointment total `cost` must be set to $6000
- **And** the appointment `payment_status` must be set to `debt`
