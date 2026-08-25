# Proposal: WhatsApp Bridge Reconnection

> **Status (2026-08-25):** `server/services/communication/whatsappBridgeService.js` was removed as dead code in PR #430 (its `require` in `server/app.js` was commented out and it had zero live importers — never wired in). Server-side reconnection work now targets the active bridge client `whatsappService.js` (see Affected Areas). The Go bridge (`whatsapp-bridge-go/main.go`) reconnection scope is unchanged.

## Intent

The WhatsApp bridge enters a dead state when the session expires: `c.Store.ID` persists but `c.IsLoggedIn()` returns false without generating a new QR. No auto-recovery exists — the only fix is nuking the SQLite DB via `/api/refresh`. Users lose queued messages and must re-pair manually. We need automatic reconnection, message queueing during downtime, and QR display in both Config and ChatPage.

## Scope

### In Scope
- Go bridge lifecycle event handling (`events.LoggedOut`, `events.Disconnected`) + auto-reconnect
- Status endpoint granularity (`session_expired`, `disconnected`, `connected`)
- Server-side send retry with message queue during bridge downtime
- ChatPage bridge status awareness + inline scannable QR code
- Docker healthcheck for bridge container
- Admin notification on failed auto-reconnect

### Out of Scope
- WebSocket / SSE real-time push (polling is sufficient)
- Full connection state machine or connection manager struct
- Multi-device or multi-clinic WhatsApp support
- Message queue persistence to DB (in-memory queue is sufficient)

## Capabilities

### New Capabilities
- `whatsapp-bridge`: WhatsApp bridge lifecycle management — connection, auto-reconnect, QR pairing, status reporting, message sending with retry, and Docker healthcheck compliance

### Modified Capabilities
- None (no existing WhatsApp specs)

## Approach

Guarded reconnection lifecycle (Approach 2 from exploration):

1. **Go bridge**: Add handlers for `events.LoggedOut` / `events.Disconnected`. On disconnect, wait 5s (antiflicker), then call `connectClient()` to re-enter QR pairing — no DB nuke. Rate-limit to 3 auto-attempts, then enter `awaiting_admin` state.
2. **Go status**: Return `session_expired`, `disconnected`, `connected`, or `awaiting_admin` with `session_expired_since` timestamp.
3. **Go health**: Add `GET /api/health` endpoint for Docker healthcheck.
4. **Server queue**: `sendMessageDirect` catches 401/503, queues message in-memory, retries on bridge reconnect with exponential backoff. No queue size limit.
5. **ChatPage QR**: Render inline scannable QR code when bridge is `disconnected` / `session_expired`. Show status banner with "Reconectar" button.
6. **Admin notification**: After 3 failed auto-reconnect attempts, show persistent banner with guided QR scan flow.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `whatsapp-bridge-go/main.go` | Modified | Event handlers, auto-reconnect, status granularity, /api/health |
| `server/services/communication/whatsappService.js` | Modified | Send retry with queue, status passthrough (absorbs the former `whatsappBridgeService.js` health-check role) |
| `server/controllers/communication/whatsappController.js` | Modified | Pass through new status fields |
| `server/routes/communication/whatsappRoutes.js` | Modified | Any new endpoints |
| `client/src/features/chat/ChatPage.jsx` | Modified | Bridge status indicator + inline QR |
| `client/src/features/chat/hooks/useMessagesPageController.js` | Modified | Bridge status polling |
| `client/src/components/organisms/GlobalWhatsappMessenger.jsx` | Modified | Updated status mapping |
| `client/src/components/molecules/WhatsappPairing.jsx` | Modified | Extract reusable QR component |
| `docker-compose.yml` / `docker-compose.prod.yml` | Modified | Healthcheck config |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Whatsmeow event ordering race | Low | 5s antiflicker delay before reconnect |
| Stale message ordering | Low | Queue messages in order, send FIFO on reconnect |
| Multiple QR generation loop | Low | Cap at 3 auto-attempts, then await_admin |
| Docker healthcheck false positive | Low | Check /api/health returns 200 + auth status |

## Rollback Plan

1. Revert all Go bridge changes — bridge returns to current dead-state behavior
2. Revert server queue changes — send throws immediately as before
3. Revert frontend ChatPage changes — no QR display in chat
4. Remove healthcheck from docker-compose

## Dependencies

- whatsmeow library (already in use) — no new dependencies

## Success Criteria

- [ ] Bridge auto-recovers from session expiry without DB deletion
- [ ] Messages sent during downtime are delivered FIFO after reconnect
- [ ] ChatPage shows inline scannable QR when bridge is disconnected
- [ ] Admin notification appears after 3 failed reconnect attempts
- [ ] Docker healthcheck catches unauthenticated bridge state
