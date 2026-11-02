---
title: Web Client
type: entity
responsibility: React 19 single-page application with atomic design, CSS modules, and context providers.
sources:
  - client/src/main.jsx
synced: d34c1014
sources_key: 0e388fad3e38
related:
  - ../architecture.md
  - ./server.md
generated: { by: antigravity/gemini-flash, at: 2026-10-27T05:07:00Z }
---

# Web Client

The web client provides the main administrative and clinical interface for secretaries and physicians.

## Entry Point and Context Stack

The application mounts on `#root` wrapped in React StrictMode and React Router ([client/src/main.jsx:18](../../client/src/main.jsx#L18)).

Global state is organized across modular context providers ([client/src/main.jsx:21-28](../../client/src/main.jsx#L21-L28)):
- `AuthProvider`: Session and user credential state.
- `LanguageProvider`: Internationalization helper and active dictionary.
- `MessageProvider`: Toast and user notification system.
- `ConfigProvider`: Workspace and environment settings.
- `DoctorProvider`: Active doctor filter context for multi-practitioner offices.
- `SearchProvider`: Global search suggestions and query states.
- `ModalProvider`: Dynamic modal dialog coordinator.

Global CSS variables and design tokens are declared in `client/src/index.css` ([client/src/main.jsx:8](../../client/src/main.jsx#L8)), while all UI components enforce scoped CSS modules.
