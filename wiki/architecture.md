---
title: System Architecture
type: architecture
responsibility: Overview of Secretary App monorepo structure, subsystems, and runtime boundaries.
sources:
  - server/app.js
  - client/src/main.jsx
  - whatsapp-bridge-go/main.go
synced: b93a162aef0641d445aa6e39fe55da80072c792c
sources_key: ca01c10ce308
generated: { by: antigravity/gemini-flash, at: 2026-10-27T05:07:00Z }
verified: { by: antigravity/gemini-flash, at: 2026-11-02T10:58:00Z }
---

# System Architecture

Secretary App is a medical office and clinical management platform designed to coordinate doctors, medical secretaries, patients, and financial transactions.

## Subsystems and Workspaces

1. **Backend Server (`server/`)**:
   - Express REST API running on Node.js ([server/app.js:32](../server/app.js#L32)).
   - Follows an MVC + Repository layered architecture.
   - Integrates with MySQL via connection pooling and stored procedures for transaction safety.
   - See [components/server.md](./components/server.md).

2. **Web Client (`client/`)**:
   - Single-Page Application (SPA) built with React 19 and Vite ([client/src/main.jsx:4](../client/src/main.jsx#L4)).
   - Organised following Atomic Design with CSS Modules and Design Tokens.
   - See [components/client.md](./components/client.md).

3. **WhatsApp Bridge (`whatsapp-bridge-go/`)**:
   - Standalone Go service using `whatsmeow` and SQLite session persistence ([whatsapp-bridge-go/main.go:19](../whatsapp-bridge-go/main.go#L19)).
   - Manages QR authentication and relays messaging events between WhatsApp and the Node backend.
   - See [components/whatsapp-bridge.md](./components/whatsapp-bridge.md).

4. **Mobile Client (`mobile/`)**:
   - React Native application managed with Expo for mobile access by doctors and staff.

## Core Flows and Conventions

- **Appointment Scheduling**: Managed via [flows/appointment-booking.md](./flows/appointment-booking.md).
- **Tariffs and Pricing**: Centralized in the database engine, detailed in [flows/price-calculation.md](./flows/price-calculation.md).
- **Financial Balances & Debt**: Managed according to [concepts/debt-lifecycle.md](./concepts/debt-lifecycle.md).
- **Database Encapsulation**: Rationale documented in [decisions/db-procedures-for-financial-invariants.md](./decisions/db-procedures-for-financial-invariants.md).
