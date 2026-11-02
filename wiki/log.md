# Wiki Log

## 2026-10-27

* **wikipoke-ingest (seed)**: initial seed of Secretary App code wiki.
  - Tailored `wiki/.wikipokeignore` to exclude backups, SQL dumps, binary uploads, and root maintenance scripts.
  - architecture.md: overview of subsystems (Express server, React 19 client, WhatsApp bridge daemon, mobile app).
  - components/server.md: Express server architecture, routing, context extraction, and rate limits.
  - components/client.md: React client entry point, provider hierarchy, and styling constraints.
  - components/whatsapp-bridge.md: Go whatsmeow daemon and SQLite session storage.
  - flows/appointment-booking.md: appointment creation, slot collision verification, and transaction creation.
  - flows/price-calculation.md: centralized pricing logic in DB stored function.
  - concepts/debt-lifecycle.md: pending transactions vs active debt on terminal appointment states.
  - decisions/db-procedures-for-financial-invariants.md: rationale for database stored procedures managing financial integrity.
