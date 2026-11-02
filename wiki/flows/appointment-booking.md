---
title: Appointment Booking Flow
type: flow
responsibility: End-to-end appointment creation, slot concurrency validation, and transaction creation.
sources:
  - server/01-schema.sql
synced: d34c1014
sources_key: e6f9093915b4
related:
  - ../architecture.md
  - ./price-calculation.md
  - ../concepts/debt-lifecycle.md
  - ../decisions/db-procedures-for-financial-invariants.md
generated: { by: antigravity/gemini-flash, at: 2026-10-27T05:07:00Z }
---

# Appointment Booking Flow

Appointment creation is executed via the atomic stored procedure `sp_book_appointment` in MySQL.

## Execution Sequence

1. **Concurrency Validation**:
   - The procedure verifies that no non-cancelled appointment already occupies the requested doctor and time slot ([server/01-schema.sql:1786-1790](../../server/01-schema.sql#L1786-L1790)).
   - If occupied, it raises a custom SQL error `slot_already_taken` ([server/01-schema.sql:1793](../../server/01-schema.sql#L1793)).
2. **Appointment Record Creation**:
   - Inserts record into `appointments` with default `pending` status ([server/01-schema.sql:1797-1802](../../server/01-schema.sql#L1797-L1802)).
   - Captures `LAST_INSERT_ID()` ([server/01-schema.sql:1805](../../server/01-schema.sql#L1805)).
3. **Financial Transaction Allocation**:
   - If bonified (`p_bonified = 1`), inserts a zero-value transaction with status `paid` and method `bonified` ([server/01-schema.sql:1809-1816](../../server/01-schema.sql#L1809-L1816)).
   - Otherwise, invokes `fn_calculate_service_price` ([server/01-schema.sql:1829](../../server/01-schema.sql#L1829)).
   - If an insurance institution is associated, splits the total cost between the patient's share and the institution's coverage ([server/01-schema.sql:1832-1837](../../server/01-schema.sql#L1832-L1837)).
   - Inserts pending income transactions on account for both shares ([server/01-schema.sql:1840-1856](../../server/01-schema.sql#L1840-L1856)).
