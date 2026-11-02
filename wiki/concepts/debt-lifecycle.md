---
title: Debt Accrual and Lifecycle
type: concept
responsibility: Rules distinguishing pending appointment transactions from active patient debt.
sources:
  - server/01-schema.sql
synced: d34c1014
sources_key: e6f9093915b4
related:
  - ../architecture.md
  - ../flows/appointment-booking.md
generated: { by: antigravity/gemini-flash, at: 2026-10-27T05:07:00Z }
---

# Debt Accrual and Lifecycle

In Secretary App, scheduling a future appointment creates a pending ledger entry without immediately generating debt for the patient.

## Active Debt vs. Future Appointments

1. **Transaction Initialization**:
   - Booking an appointment writes a transaction in `pending` status on account ([server/01-schema.sql:1844-1845](../../server/01-schema.sql#L1844-L1845)).
2. **Accrual Condition**:
   - Balances and account statements only compute transactions as active payable debt once the associated appointment reaches a terminal attendance state (`completed`, `attended`, `arrived`, or `absent`).
   - Appointments still in `pending`, `scheduled`, or `reserved` do not penalize patient account balances.
3. **Debt Settlement**:
   - Patients can settle accrued debts across multiple visits via dedicated batch stored procedures (`proc_pay_patient_debt` in [server/01-schema.sql:1654](../../server/01-schema.sql#L1654)).
