# WhatsApp Bridge Specification

## Purpose

Defines connection lifecycle, status reporting, send resilience, and health of the WhatsApp bridge across Go, server, frontend, and Docker.

## Requirements

### Requirement: Automatic reconnection on session loss

The Go bridge MUST handle `events.LoggedOut`/`events.Disconnected` by waiting 5s then calling `connectClient()` to re-enter QR pairing without deleting the SQLite DB. Auto-attempts are capped at 3; afterward it enters `awaiting_admin` and stops.

#### Scenario: Auto-recovers within attempts

- GIVEN the bridge is connected and the session expires
- WHEN `events.LoggedOut` fires and the delay elapses
- THEN it re-enters QR pairing without deleting the SQLite DB

#### Scenario: Attempts exhausted

- GIVEN three auto-reconnect attempts failed
- WHEN the third attempt fails
- THEN it enters `awaiting_admin` and stops auto-reconnecting

### Requirement: Granular bridge status reporting

`/api/status` MUST return exactly one of `connected`, `disconnected`, `session_expired`, `awaiting_admin`, including `session_expired_since` (ISO-8601) for `session_expired`/`disconnected`, null/omitted otherwise.

#### Scenario: Expired vs disconnected reported

- GIVEN the session is lost but the bridge runs
- WHEN a client requests `/api/status`
- THEN status is `session_expired`/`disconnected` with `session_expired_since`

### Requirement: Bridge health endpoint

The Go bridge MUST expose `GET /api/health` returning 200 with `{ "authenticated": boolean }`, even when unauthenticated, as a liveness probe.

#### Scenario: Probe while unauthenticated

- GIVEN the bridge runs but is not logged in
- WHEN a client requests `GET /api/health`
- THEN it returns 200 with `{ "authenticated": false }`

### Requirement: Authenticated send error codes

`/api/send` MUST return 401 when unauthenticated and 503 only when the bridge cannot service the request.

#### Scenario: Send while logged out

- GIVEN the bridge runs but the session is expired
- WHEN a client posts to `/api/send`
- THEN the bridge returns 401

### Requirement: Server-side message queue and retry

`sendMessageDirect` MUST catch 401/503, queue the message in memory, and retry FIFO on reconnect with exponential backoff. The surfaced error SHALL include the real bridge cause, not a generic "bridge not responding".

#### Scenario: Queued during downtime

- GIVEN the bridge returns 401/503 on send
- WHEN `sendMessageDirect` is called
- THEN the message is queued and retried FIFO after reconnect, with the real cause in any final error

### Requirement: Status and health pass-through

`whatsappController.js`/`whatsappRoutes.js` MUST pass through `session_expired`, `awaiting_admin`, `session_expired_since` unchanged and mount the bridge health route, without stripping or renaming them.

#### Scenario: Controller forwards granular status

- GIVEN the bridge reports `session_expired` with `session_expired_since`
- WHEN the server status endpoint is queried
- THEN the response includes those fields unmodified

### Requirement: ChatPage status indicator with inline QR

ChatPage MUST show a bridge status indicator. When state is `disconnected`/`session_expired` it SHALL render an inline scannable QR and a "Reconectar" button that reconnects without page reload.

#### Scenario: Inline QR on disconnect

- GIVEN the bridge status is `disconnected` or `session_expired`
- WHEN ChatPage renders
- THEN it shows the indicator, inline QR, and "Reconectar" button

### Requirement: Global messenger status mapping

`GlobalWhatsappMessenger.jsx` MUST map granular statuses to UI states, treating `session_expired` distinctly from plain `disconnected`.

#### Scenario: Session-expired mapped distinctly

- GIVEN the bridge reports `session_expired`
- WHEN the messenger polls status
- THEN it renders the session-expired state, not generic disconnected

### Requirement: Admin banner after failed auto-reconnect

After 3 failed attempts (bridge `awaiting_admin`) the frontend MUST show a persistent admin banner with guided QR scan flow until the session is restored.

#### Scenario: Banner on awaiting_admin

- GIVEN the bridge is `awaiting_admin` after 3 failures
- WHEN the admin view loads
- THEN a persistent banner with QR guidance is shown

### Requirement: Docker healthcheck on bridge container

`docker-compose.yml`/`docker-compose.prod.yml` MUST define a bridge healthcheck that calls `GET /api/health` and treats 200 as healthy (liveness, not process existence).

#### Scenario: Compose healthcheck uses health endpoint

- GIVEN the bridge container is defined in compose
- WHEN Docker evaluates the healthcheck
- THEN it probes `/api/health` and marks healthy on 200
