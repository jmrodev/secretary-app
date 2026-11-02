---
okf_version: "0.2"
---

# Secretary App Code Wiki

## Architecture

- [System Architecture](architecture.md): Overview of Secretary App monorepo structure, subsystems, and runtime boundaries.

## Components

- [Server Application](components/server.md): Express MVC backend providing REST APIs, authentication, and database orchestration.
- [Web Client](components/client.md): React 19 single-page application with atomic design, CSS modules, and context providers.
- [WhatsApp Bridge](components/whatsapp-bridge.md): Go daemon managing WhatsApp Web session, QR authentication, and event webhooks.

## Flows

- [Appointment Booking Flow](flows/appointment-booking.md): End-to-end appointment creation, slot concurrency validation, and transaction creation.
- [Medical Service Pricing Flow](flows/price-calculation.md): Pricing resolution through doctor tariffs, institution coverage, and patient copays.

## Concepts

- [Debt Accrual and Lifecycle](concepts/debt-lifecycle.md): Rules distinguishing pending appointment transactions from active patient debt.

## Decisions

- [Database Stored Procedures for Financial and Booking Invariants](decisions/db-procedures-for-financial-invariants.md): Why critical financial calculations and slot reservations run in MySQL stored routines.
