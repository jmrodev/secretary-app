---
title: Server Application
type: entity
responsibility: Express MVC backend providing REST APIs, authentication, and database orchestration.
sources:
  - server/app.js
synced: b93a162aef0641d445aa6e39fe55da80072c792c
sources_key: 198ab0a380f1
related:
  - ../architecture.md
  - ./client.md
  - ./whatsapp-bridge.md
generated: { by: antigravity/gemini-flash, at: 2026-10-27T05:07:00Z }
verified: { by: antigravity/gemini-flash, at: 2026-11-02T10:58:00Z }
---

# Server Application

The server is an Express.js backend providing REST endpoints for administrative, medical, and patient interactions.

## Responsibilities & Layers

- **Security & Middlewares**:
  - Global rate limiting configured on all incoming requests ([server/app.js:19](../../server/app.js#L19)).
  - Request logging with Morgan and custom sanitization via `safeJsonReplacer` ([server/app.js:34](../../server/app.js#L34)).
  - Background scheduler initialization ([server/app.js:42](../../server/app.js#L42)).
- **Doctor Context Resolution**:
  - Middleware intercepts `x-doctor-id` header to bind current doctor context to requests ([server/app.js:94](../../server/app.js#L94)).
- **Modular Routing**:
  - Authentication routes at `/api/auth` ([server/app.js:102](../../server/app.js#L102)).
  - Appointments at `/api/appointments` ([server/app.js:104](../../server/app.js#L104)).
  - Financial operations and accounts at `/api/finances` ([server/app.js:113](../../server/app.js#L113)).
  - WhatsApp webhook and interaction endpoints at `/api/whatsapp` ([server/app.js:107](../../server/app.js#L107)).
- **Centralized Error Handling**:
  - Global Express error handling middleware mounted at the end of the pipeline ([server/app.js:129](../../server/app.js#L129)).
