# Design: WhatsApp Bridge Reconnection

## Technical Approach

Guarded reconnection lifecycle. Go bridge gains `LoggedOut`/`Disconnected` handlers: wait 5s (antiflicker), re-enter QR pairing WITHOUT deleting the SQLite DB, capped at 3 attempts → `awaiting_admin`. Status becomes granular (`connected`/`disconnected`/`session_expired`/`awaiting_admin`). New `/api/health` feeds the Docker healthcheck. Server gains an in-memory FIFO retry queue in `sendMessageDirect` (401/503 → enqueue, exponential-backoff flush). ChatPage shows inline QR + "Reconectar" on disconnect.

## Architecture Decisions

### Decision: Reconnect trigger & attempt cap
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Full connection-manager struct | Robust, but out of scope per proposal | Rejected |
| Background goroutine auto-reconnect in `eventHandler` | Simple, reuses existing `connectClient()` | **Chosen** |
| Restart whole process via `WhatsAppBridgeService` | Loses in-memory queue/state | Rejected |

**Rationale**: Reuses `connectClient()` and `clientMu` locking; change stays localized to `main.go`.

### Decision: Status state model
| State | Condition |
|-------|-----------|
| `connected` | `c.IsLoggedIn()` |
| `session_expired` | `Store.ID != nil && !IsLoggedIn()` (lost session, DB intact) |
| `disconnected` | `client == nil` / no `Store.ID` |
| `awaiting_admin` | 3 reconnect attempts exhausted (new `reconnectState` var) |

**Rationale**: Mirrors whatsmeow semantics; `session_expired_since` timestamp added for UI guidance.

### Decision: Send error codes
| Condition | HTTP |
|-----------|------|
| `!c.IsLoggedIn()` | 401 |
| `c==nil \|\| !c.IsConnected()` | 503 |
| send fails mid-flight | 503 |

**Rationale**: Spec mandates 401 when unauthenticated; current code only checked `IsConnected()`.

### Decision: Server retry queue location
New module `server/services/communication/whatsappRetryQueue.js` (singleton array + timer), called by `sendMessageDirect`.
**Rationale**: Isolates queue logic for Jest RED tests; keeps `whatsappService.js` focused.

### Decision: Queue flush strategy
Background timer polls bridge, exponential backoff (1s→30s); 200 dequeues FIFO; 401/503 retries; after N attempts marks `failed`.
**Rationale**: Avoids a Go reconnect event; resilient to ordering races.

## Data Flow

```
Go bridge                 Server                      Client
events.LoggedOut ─┐
                 ├─> wait5s → connectClient() ──> QR pairing (no DB nuke)
/disconnected    ┘          │ capped@3 → awaiting_admin
GET /api/health ──────────> docker-compose healthcheck (200=liveness)
GET /api/status ──────────> whatsappService.getBridgeStatus ──> controller ──> ChatPage poll
POST /api/send (401/503) ─> sendMessageDirect ─> whatsappRetryQueue.enqueue
        ▲                                                            │ backoff flush
        └───────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `whatsapp-bridge-go/main.go` | Modify | Add `Disconnected`/`LoggedOut` reconnect, `reconnectState`, granular `handleStatus`, 401/503 in `handleSend`, `handleHealth`, register `/api/health` |
| `server/services/communication/whatsappRetryQueue.js` | Create | In-memory FIFO queue + exponential-backoff flush loop |
| `server/services/communication/whatsappService.js` | Modify | `sendMessageDirect` catches 401/503 → enqueue; `getBridgeStatus` passes `session_expired`/`awaiting_admin`/`session_expired_since`; add `getBridgeHealth` |
| `server/controllers/communication/whatsappController.js` | Modify | Add `getBridgeHealth`; `sendDirectMessage` returns 202 `{queued:true}` when enqueued |
| `server/routes/communication/whatsappRoutes.js` | Modify | Add token-gated `GET /health` → `getBridgeHealth` |
| `client/src/features/chat/ChatPage.jsx` | Modify | Status indicator + inline QR + Reconectar button |
| `client/src/features/chat/hooks/useMessagesPageController.js` | Modify | Poll bridge status |
| `client/src/components/organisms/GlobalWhatsappMessenger.jsx` | Modify | Map `session_expired` distinctly |
| `client/src/components/molecules/WhatsappPairing.jsx` | Modify | Reusable QR (extract prop for external use) |
| `docker-compose.yml` / `docker-compose.prod.yml` | Modify | Bridge healthcheck → `GET /api/health` |

## Interfaces / Contracts

```go
// GET /api/health  (always 200)
{ "authenticated": false }

// GET /api/status
{ "status": "session_expired", "qr_code": "<code|'>", "session_expired_since": "2026-08-25T10:00:00Z" }

// POST /api/send
401 {"error":"not authenticated"}  |  503 {"error":"bridge unavailable"}
```

```js
// server queue interface (whatsappRetryQueue.js)
enqueue({ to, message, patientId }) -> void
// flush loop: FIFO, exponential backoff, marks 'failed' after maxAttempts
// GET /api/whatsapp/health -> { success:true, authenticated:boolean }
// POST /api/whatsapp/send-direct -> 202 { queued:true } when enqueued
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Go unit | Reconnect caps at 3 → awaiting_admin; no DB delete on LoggedOut | Test `eventHandler`/`reconnectState` with mocked client |
| Go http | `/api/health` returns 200 + authenticated even when logged out; `/api/send` 401 when `!IsLoggedIn` | `httptest` RED tests |
| Server (Jest, strict_tdd) | Queue enqueues on 401/503, flushes FIFO after bridge 200; surfaced error keeps real cause | Mock axios; RED tests before impl |
| Frontend | ChatPage shows QR on `session_expired`/`disconnected`; Reconectar present | React Testing Library |

## Threat Matrix

| Boundary | Applicable | Reason |
|----------|-----------|--------|
| Documentation-like paths | N/A | No path/classification from untrusted input |
| Git repository selection | N/A | No git command construction |
| Commit state | N/A | No commit commands |
| Push state | N/A | No push/refspec commands |
| PR commands | N/A | No PR command composition |

Routing/process boundary exists (new endpoints, compose healthcheck) but no shell/git untrusted-input construction → no RED adversarial tests required.

## Migration / Rollout

No data migration (queue is in-memory). Feature flag not required. Rollback: revert Go changes (returns to dead-state), revert server queue (`sendMessageDirect` throws immediately), remove frontend QR, remove compose healthcheck. Each layer independently reversible.

## Open Questions

- None.
