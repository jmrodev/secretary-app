## Exploration: WhatsApp Bridge Reconnection

### Current State

**Go Bridge (whatsapp-bridge-go/main.go)**
The bridge uses whatsmeow with SQLite session storage (`data/examplestore.db`). On startup, `connectClient()` checks `c.Store.ID`:
- **Session exists**: calls `c.Connect()` to resume — but has NO handling for expired sessions. When a session expires via QR timeout, `c.Store.ID` is still present (device metadata persists in DB), so `c.IsLoggedIn()` returns `false` but NO new QR code is generated. The bridge enters a dead state: status returns `"disconnected"`, QR is empty, and the only way out is the nuclear `/api/refresh` which **deletes the entire SQLite DB**.
- **No session**: starts QR pairing flow — handles `code`, `success`, and `timeout` events via channel.

The `/api/status` endpoint returns `"connected"` only when `c.IsLoggedIn()`, `"disconnected"` otherwise. No distinction between "bridge is up but not authenticated" and "session expired".

The `/api/send` endpoint returns 503 `"WhatsApp not connected"` when client is nil or not connected.

The event handler only processes `*events.Message` — it does NOT listen for `events.Disconnected`, `events.LoggedOut`, or other lifecycle events that could trigger auto-repair.

**Server (whatsappBridgeService.js)**
- `isBridgeRunning()`: only checks HTTP 200 — does NOT check auth status
- `startBridge()`: spawns `go run main.go` for dev (redundant in Docker where `restart: always` handles this)
- Restarts only on exit code `!= 0` with 5s delay

**Server (whatsappService.js)**
- `getBridgeStatus()`: proxies GET to `/api/status` — returns whatever the Go bridge says
- `sendMessageDirect()`: catches any error and throws `"Local WhatsApp bridge is not responding"` — **this hides the real cause** (could be bridge down, session expired, network issue, or actual send failure)
- `refreshBridge()` / `logoutBridge()`: thin proxies to Go endpoints

**Frontend (GlobalWhatsappMessenger.jsx)** — the floating WhatsApp messenger
- Polls `/whatsapp/status` every 5s when open
- Three states: `offline` (bridge not reachable), `connected` (logged in), `disconnected` (bridge up but unauthenticated)
- When `disconnected` and QR is empty, auto-refreshes (nuclear DB delete)
- Shows `WhatsappPairing` overlay when status !== `connected` — has QR display, refresh, and disconnect buttons

**Frontend (ChatPage)** — the full-page `/messages` route
- Has ZERO bridge status awareness
- No status indicator, no warning, no reconnection UI
- Uses `useMessagesPageController` which only polls `/messages/conversations` — completely separate from WhatsApp bridge

### Affected Areas

- `whatsapp-bridge-go/main.go` — Core bridge: session expiry handling, lifecycle events, status endpoint granularity
- `server/services/communication/whatsappService.js` — `sendMessageDirect` error handling and `getBridgeStatus`
- `server/services/communication/whatsappBridgeService.js` — `isBridgeRunning` health check sophistication
- `server/controllers/communication/whatsappController.js` — Controller layer if we add new endpoints
- `server/routes/communication/whatsappRoutes.js` — Route layer if we add new endpoints
- `client/src/components/organisms/GlobalWhatsappMessenger.jsx` — Status polling and reconnection UI
- `client/src/components/molecules/WhatsappPairing.jsx` — Pairing/QR display (already good, minor tweaks)
- `client/src/features/chat/ChatPage.jsx` — Add bridge status indicator
- `client/src/features/chat/hooks/useMessagesPageController.js` — Add bridge status awareness
- `client/src/components/atoms/StatusIndicator.jsx` — Reusable status indicator (already exists)
- `docker-compose.yml` / `docker-compose.prod.yml` — Bridge container env/healthcheck

### Approaches

1. **Incremental repairs (Low-Medium effort)** — Fix the critical gaps without redesign
   - **Go**: Add `events.Disconnected` / `events.LoggedOut` handler that auto-enters QR pairing mode without deleting DB
   - **Go**: Distinguish `"disconnected"` vs `"session_expired"` in `/api/status`
   - **Go**: On `send` failure when logged out, return 401 instead of 503
   - **Server**: Make `sendMessageDirect` error message include the actual bridge response
   - **Frontend**: Add `StatusIndicator` to ChatPage showing bridge connection state
   - **Server**: Add and mount a `GET /api/health` endpoint to the Go bridge for Docker healthcheck
   - Pros: Low risk, addresses immediate pain, preserves existing architecture
   - Cons: Nuclear refresh still a fallback, message queuing not addressed

2. **Guarded reconnection lifecycle (Medium effort)** — All of approach 1, plus:
   - **Go**: Listen for `events.LoggedOut` / `events.Disconnected` and immediately call `connectClient()` to re-enter pairing — no DB nuke needed
   - **Go**: Add `session_expired_since` timestamp in status response so frontend knows how long user has been disconnected
   - **Server**: Add periodic health check (every 60s) that logs warnings when bridge is disconnected
   - **Frontend**: Add "Reconnectar" button on ChatPage that triggers `/whatsapp/refresh` without page reload
   - **Frontend**: Show a non-blocking toast/banner when bridge status changes to disconnected
   - **Frontend**: Add auto-retry with exponential backoff when send fails due to disconnected bridge (queue and retry)
   - Pros: Much better UX, no data loss, graceful degradation
   - Cons: More Go work, need to handle race conditions in reconnection

3. **Full connection manager (High effort)** — Redesign bridge connection lifecycle
   - **Go**: Implement a `ConnectionManager` struct with state machine (IDLE → PAIRING → CONNECTED → EXPIRED → RECONNECTING → ...)
   - **Go**: Add `/api/qr` endpoint to get current QR code without full status response
   - **Go**: Add WebSocket endpoint for real-time status pushes to server
   - **Server**: Replace polling with EventSource/SSE for real-time status updates
   - **Server**: Add message queue for offline periods (store to DB, send when connected)
   - **Frontend**: Real-time badge/indicator on chat icon in nav, toast on disconnect
   - Pros: Robust, production-grade, real-time UX
   - Cons: Significant Go refactor, WebSocket/SSE infrastructure, higher testing burden

### Recommendation

**Approach 2 — Guarded reconnection lifecycle.**

The incremental approach (1) fixes symptoms but doesn't address the root cause: an expired session leaves the bridge in a dead state with no automatic recovery. Approach 3 is over-engineered for a bridge that serves a single clinic — WebSocket and full state machines are premature.

Approach 2 gives us:
1. **Automatic recovery** from session expiry without DB deletion (the Go bridge re-enters QR mode on its own)
2. **Better status granularity** so the frontend knows what's happening
3. **ChatPage awareness** so users see disconnection in the messages view too
4. **Graceful send handling** with retry for transient disconnections

The Go changes are focused: add 2-3 event handlers and a reconnection trigger. No DB schema change, no new infrastructure.

### Risks

- **Whatsmeow event timing**: If `events.LoggedOut` fires before `client.Disconnect()` completes, we could have a race. Need to test the event ordering.
- **Stale message queue**: If we queue messages while disconnected, order might confuse users if messages arrive out of sequence after reconnection.
- **Multiple QR generations**: Auto-reconnect could generate new QR codes in a loop if the user isn't watching. Need to rate-limit auto-repair attempts (max 3, then wait for user action).
- **Docker healthcheck**: Currently no healthcheck on the bridge container. If the process is running but not serving, Docker thinks it's healthy. Could add a `curl` healthcheck.

### Ready for Proposal

Yes. The scope is well-understood and approaches are clear. Recommend moving to `sdd-propose` with Approach 2 as the baseline.
