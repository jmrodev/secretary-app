---
title: WhatsApp Bridge
type: entity
responsibility: Go daemon managing WhatsApp Web session, QR authentication, and event webhooks.
sources:
  - whatsapp-bridge-go/main.go
synced: d34c1014
sources_key: e1e1d8d3fbe7
related:
  - ../architecture.md
  - ./server.md
generated: { by: antigravity/gemini-flash, at: 2026-10-27T05:07:00Z }
---

# WhatsApp Bridge

The WhatsApp Bridge is an independent daemon written in Go that interfaces with WhatsApp Web using the `whatsmeow` library.

## Architecture & Responsibilities

- **Session Store**:
  - Uses SQLite at `data/examplestore.db` to maintain session encryption keys and pairing tokens ([whatsapp-bridge-go/main.go:28](../../whatsapp-bridge-go/main.go#L28)).
- **Connection Management**:
  - Thread-safe state tracking for reconnection attempts and QR code regeneration ([whatsapp-bridge-go/main.go:38-42](../../whatsapp-bridge-go/main.go#L38-L42)).
  - Helper `isClientAuthenticated` allows injection during tests ([whatsapp-bridge-go/main.go:47](../../whatsapp-bridge-go/main.go#L47)).
- **Integration with Backend**:
  - Forwards incoming messages and delivery statuses to Express server webhook endpoints, allowing automated appointment reminders and messaging.
