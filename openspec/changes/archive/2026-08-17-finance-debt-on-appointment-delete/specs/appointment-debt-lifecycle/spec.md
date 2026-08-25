# Appointment Debt Lifecycle Specification

## Purpose

Debt policy for appointment deletion, cancellation, and absence (R1-R6). Debt mutations are atomic and labeled.

## Requirements

### Requirement: Debt requires rendered service

Pending debt MUST NOT exist for appointments whose service was never rendered (R1).

#### Scenario: Non-rendered appointment deleted

- GIVEN an appointment without rendered service and a pending transaction
- WHEN the appointment is deleted
- THEN the pending transaction MUST be removed

### Requirement: Attended delete retains debt

Deleting an appointment with rendered service MUST retain its pending transactions, labeled "Deuda (Turno Eliminado)" (R2).

#### Scenario: Completed appointment deleted

- GIVEN a completed appointment without medical records and a pending transaction
- WHEN the appointment is deleted
- THEN the transaction MUST remain, detached, labeled, payable

#### Scenario: Delete blocked by medical records

- GIVEN a completed appointment with an associated prescription or medical license
- WHEN deletion is attempted
- THEN it MUST fail with "No se puede eliminar: tiene registros médicos asociados"
- AND no transaction MUST change

### Requirement: Future delete removes debt

Deleting an appointment without rendered service MUST remove its pending transactions (R3).

#### Scenario: Confirmed appointment deleted

- GIVEN a confirmed appointment with a pending transaction
- WHEN the appointment is deleted
- THEN the pending transaction MUST be removed

### Requirement: Absent retains and charges debt

Marking absent MUST retain pending transactions, include them in active debt, and keep payment_status (R4). Historical absent MUST NOT be recalculated (D3).

#### Scenario: Absent with pending debt

- GIVEN a confirmed appointment with a pending transaction
- WHEN the appointment is marked absent
- THEN the transaction MUST remain and count toward active debt

#### Scenario: Historical absent untouched

- GIVEN appointments marked absent before this change
- WHEN the new policy is applied
- THEN no historical transaction MUST change

### Requirement: Cancel removes pending debt

Cancelling an appointment MUST remove its pending transactions (R5).

#### Scenario: Cancelled with pending debt

- GIVEN a confirmed appointment with a pending transaction
- WHEN the appointment is cancelled
- THEN the pending transaction MUST be removed

### Requirement: Paid appointment removal

Deleting a paid appointment MUST keep its paid transactions (income kept); cancelling MUST label them "Saldo a favor (Turno Eliminado)" (R6).

#### Scenario: Paid appointment deleted (no-show)

- GIVEN a paid appointment with paid transactions
- WHEN the appointment is deleted
- THEN the paid transactions MUST remain unchanged

#### Scenario: Paid appointment cancelled

- GIVEN a paid appointment with paid transactions
- WHEN the appointment is cancelled
- THEN the paid transactions MUST be labeled "Saldo a favor (Turno Eliminado)"

#### Scenario: Deleted cancelled paid appointment

- GIVEN a cancelled paid appointment with labeled transactions
- WHEN the appointment is deleted
- THEN the labels MUST remain unchanged

### Requirement: Atomic debt mutations

Debt mutations MUST be applied in the same transaction as the appointment operation.

#### Scenario: Failed delete leaves debt untouched

- GIVEN a deletion failing after debt processing starts
- WHEN the operation is rolled back
- THEN no transaction MUST be modified

### Requirement: Dead finance listener branches removed

The APPOINTMENT_DELETED and APPOINTMENT_CANCELLED finance branches MUST be removed or replaced by atomic service handling; google-sync and audit listeners MUST remain functional (D2).

#### Scenario: Google sync unaffected

- GIVEN the finance listener cleanup
- WHEN APPOINTMENT_DELETED is emitted
- THEN the google-sync listener MUST still process the event

### Requirement: Orphaned test debt cleanup

A one-off cleanup MUST remove pre-change orphaned unlabeled pending test transactions and MUST NOT remove labeled debt (D1).

#### Scenario: Pre-change orphan removed

- GIVEN a pending transaction orphaned before this change and unlabeled
- WHEN the cleanup runs
- THEN the transaction MUST be removed

#### Scenario: Labeled retained debt preserved

- GIVEN a pending transaction labeled "Deuda (Turno Eliminado)"
- WHEN the cleanup runs
- THEN the transaction MUST NOT be removed