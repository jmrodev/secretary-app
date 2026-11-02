---
title: Medical Service Pricing Flow
type: flow
responsibility: Pricing resolution through doctor tariffs, institution coverage, and patient copays.
sources:
  - server/01-schema.sql
  - server/utils/finance/priceCalculator.js
synced: d34c1014
sources_key: e04d9f73cf05
related:
  - ../architecture.md
  - ./appointment-booking.md
  - ../decisions/db-procedures-for-financial-invariants.md
generated: { by: antigravity/gemini-flash, at: 2026-10-27T05:07:00Z }
---

# Medical Service Pricing Flow

Pricing logic is centralized in the database deterministic function `fn_calculate_service_price`.

## Calculation Hierarchy

The algorithm resolves the fee using three tiers of configuration:

1. **Base Doctor Tariff**:
   - Resolved from `doctors` based on service type (`consultation`, `prescription`, `medical_license`, `certificate`, or `virtual_consultation`) ([server/01-schema.sql:1486-1493](../../server/01-schema.sql#L1486-L1493)).
2. **Institution Base Price**:
   - If `institution_id` is supplied, fetches `institutions.base_price` ([server/01-schema.sql:1496-1498](../../server/01-schema.sql#L1496-L1498)).
3. **Patient Copay Adjustments**:
   - Resolves `tariff_percent` and `tariff_override` from `patients` ([server/01-schema.sql:1502-1505](../../server/01-schema.sql#L1502-L1505)).
   - A non-null `tariff_override` supersedes percentage and base rates directly.

## Node.js Invocation

The Node.js backend delegates price calculations to the stored function through `priceCalculator.calculatePrice` ([server/utils/finance/priceCalculator.js:10-15](../../server/utils/finance/priceCalculator.js#L10-L15)), ensuring backend services do not re-implement mathematical rounding or tariff rules in JavaScript.
