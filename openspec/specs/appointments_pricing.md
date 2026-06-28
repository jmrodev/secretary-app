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

### Scenario 4: Patient pays the full amount using multiple payment methods
- **Given** an appointment with a cost of $5000 and status `debt`
- **When** the patient pays $2000 in `cash` and $3000 by `card`
- **Then** the service must generate two paid transactions (`status = 'paid'`) matching the amounts and methods
- **And** the total paid amount must equal $5000
- **And** the appointment `payment_status` must be updated to `paid`

### Scenario 5: Patient pays partially (remains in debt)
- **Given** an appointment with a cost of $5000 and status `debt`
- **When** the patient pays $3000 in `cash` and specifies a remaining debt of $2000
- **Then** the service must generate one paid transaction of $3000 (`status = 'paid'`, `method = 'cash'`)
- **And** one pending transaction of $2000 (`status = 'pending'`, description contains "(Pendiente)")
- **And** the appointment `payment_status` must be set to `partial`

### Scenario 6: Institution settles its pending balance
- **Given** an appointment with an institution share transaction of $4000 in `pending` status
- **When** the institution payment is registered
- **Then** the institution pending transaction must be updated to `status = 'paid'`
- **And** if no other pending transactions exist for the appointment, the appointment `payment_status` must be updated to `paid`

### Scenario 7: Future appointment pending transaction is excluded from active debt
- **Given** a patient with a future appointment booked via `sp_book_appointment`
- **And** a pending transaction of $5000 is generated for that appointment
- **When** checking the patient's active debt balance via `getTotalDebt`
- **Then** the transaction must be excluded from the total balance because the appointment is not yet in a completed or absent status
- **And** the patient's active debt balance must be $0

### Scenario 8: Transaction becomes active debt upon appointment completion or absence
- **Given** a patient with a future appointment and a pending transaction of $5000
- **When** the appointment status is updated to `completed` or `absent`
- **Then** the transaction must be included in the total balance when calling `getTotalDebt`
- **And** the patient's active debt balance must reflect the $5000


