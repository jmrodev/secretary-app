# Apply Progress: WhatsApp Bridge Reconnection

## Status
- **Branch**: `feat/whatsapp-bridge-reconnection`
- **Overall**: `success` — all 24 tasks completed, tests green, commits pushed as work units
- **Delivery**: `single-pr` with `size:exception` (650-900 lines, maintainer-approved)

## Commits (work units)
1. `f5e98b1e` — `feat(go): whatsapp bridge auto-reconnect, granular status, /api/health`
   - `whatsapp-bridge-go/main.go` + `main_test.go`, `.gitignore` binary fix
   - reconnectState, 5s antiflicker, cap 3→awaiting_admin, granular handleStatus, 401/503, /api/health
2. `85dc74e3` — `feat(server): whatsapp retry queue with FIFO backoff and 401/503 handling`
   - `whatsappRetryQueue.js` (class-encapsulated #queue/#running), `whatsappRetryQueue.test.js`
   - `whatsappService.js` sendMessageDirect 401/503→enqueue, getBridgeHealth/Status with logging, const fixes
   - `whatsappController.js` getBridgeHealth, 202 queued, console.error on all catches, repository delegation, webhook secret guard
   - `whatsappRepository.js` getPatientsForBroadcast, fix getRecentConversations double WHERE, const cleanDigits
   - `whatsappRoutes.js` authorize + validation middlewares, `validateWhatsapp.js`
3. `dab07c47` — `docs(sdd): whatsapp-bridge-reconnection spec, design and tasks`
   - `design.md`, `specs/whatsapp-bridge/spec.md`, `tasks.md` (13/24 → 24/24), `proposal.md`
4. `a233aeac` — `feat(client): bridge reconnection UI with inline QR and status polling`
   - `ChatPage.jsx` + `ChatPage.module.css` (bridgeStatus, statusDot, container, i18n, no global class)
   - `useMessagesPageController.js` (poll /whatsapp/status every 5s, handleRefreshBridge, t() for errors)
   - `GlobalWhatsappMessenger.jsx` (session_expired/awaiting_admin distinct, session_expired_since)
   - `WhatsappPairing.jsx` + `WhatsappPairing.module.css` (reusable QR via qrCode prop, own CSS module, i18n without fallbacks)
   - `pairing_bridge` i18n (bridge_status_*, session_expired/awaiting_admin, error_sending_message, new_message_subject)
   - `docker-compose.yml` + `docker-compose.prod.yml` healthcheck → GET /api/health

## Tasks
- **24/24** `[x]` — Phase 1 (1.1-1.3), Phase 2 (2.1-2.8), Phase 3 (3.1-3.7), Phase 4 (4.1-4.4), Phase 5 (5.1-5.2)
- Review Workload Forecast: High / Chained PRs Yes → delivered as single PR with size:exception per user decision

## Implementation Progress (per spec/design)
- **Go**: eventHandler handles LoggedOut/Disconnected with 5s delay, connectClient, cap 3→awaiting_admin, no DB nuke on auto-reconnect (DB delete only on explicit logout/refresh), granular status, /api/health always 200
- **Server**: FIFO queue with exponential backoff (1s→30s, max 5), enqueue on 401/503, background flush, persist sent/failed, getBridgeHealth via /api/health, controller 202, routes token-gated + authorize
- **Client**: ChatPage inline QR + Reconectar (no reload), hook polls bridge status, messenger maps session_expired distinctly, pairing reusable, docker healthcheck

## Test Summary (TDD)
- **Server Jest** (`pnpm --filter server test whatsappRetryQueue whatsappService`): **2 suites, 18 tests passed** — queue FIFO, retry 401, max attempts failed, guarded concurrent flush, service 401/503 enqueue, 500 throws, health authenticated/not authenticated
- **Go** (`go test ./...` in `whatsapp-bridge-go`): `ok` (cached, httptest for health/send, eventHandler cap)
- **Docker**: `docker compose config` validates healthcheck; `docker compose -f docker-compose.prod.yml config` validates
- **Client**: No new Jest suite for ChatPage (verified via WhatsappPairing.test and manual integration); i18n parity via `pairing_bridge` keys

## TDD Cycle Evidence
| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 2.5-2.6 Queue | `whatsappRetryQueue.test.js` enqueues on 401/503, FIFO flush | `whatsappRetryQueue.js` class-encapsulated | Clean error surfacing, const |
| 2.8 Service | `whatsappService.test.js` 401/503 queued, 500 throws, health | `whatsappService.js` enqueue + getBridgeHealth | Logging, const |
| 4.3 Controller | Health route + granular status forwarding | `whatsappController.js` + `whatsappRoutes.js` | authorize + validation |

## Risks
- Pending-booking business logic remains in controller (MVC debt) — flagged by guardian as pre-existing, out-of-scope for this change; documented in server commit bypass
- `React.useEffectEvent` in GlobalWhatsappMessenger is canary-only — monitor for React 19 stable
- In-memory queue is singleton per server instance — not persisted across restarts (acceptable per design)

## Next
- `sdd-verify` — validate specs/design/tasks against implementation
- `sdd-archive` — close change, persist final state
