# Tasks: WhatsApp Bridge Reconnection

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650-900 (Go + JS + JSX + compose) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Go bridge PR → Server queue PR → Client UI PR → Docker healthcheck PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Go reconnect + health + 401/503 | PR 1 | `go test ./...` | `go run main.go` + curl `/api/health`,`/api/send` | `whatsapp-bridge-go/main.go` only |
| 2 | Server retry queue | PR 2 | `pnpm --filter server test` | node Jest with mocked axios | `whatsappRetryQueue.js` + `whatsappService.js` edits |
| 3 | ChatPage QR + status wiring | PR 3 | `pnpm --filter client test` | vite dev + browser pair flow | `ChatPage.jsx`,hooks,molecules,organisms |
| 4 | Docker healthcheck | PR 4 | `docker compose config` | `docker compose up` health probe | compose files only |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Add `reconnectState` + attempt counter in `whatsapp-bridge-go/main.go`.
- [x] 1.2 Create `server/services/communication/whatsappRetryQueue.js` skeleton with `enqueue`/flush exports.
- [x] 1.3 Add token-gated `GET /health` route scaffold in `server/routes/communication/whatsappRoutes.js`.

## Phase 2: Core Implementation

- [x] 2.1 [Go RED] `httptest`: `/api/health` 200+`authenticated`; `/api/send` 401 when `!IsLoggedIn`.
- [x] 2.2 Go: add reconnect handlers (5s delay, `connectClient`, cap 3→`awaiting_admin`, no DB delete).
- [x] 2.3 Go: granular `handleStatus` (`connected`/`disconnected`/`session_expired`/`awaiting_admin` + `session_expired_since`).
- [x] 2.4 Go: `handleSend` returns 401/503; register `handleHealth` + `/api/health`.
- [x] 2.5 [Server RED] Jest: queue enqueues on 401/503, flushes FIFO on 200, keeps cause.
- [x] 2.6 [Server GREEN] Implement `whatsappRetryQueue.js` (FIFO + exponential backoff).
- [x] 2.7 [Server REFACTOR] Clean error surfacing in `whatsappRetryQueue.js`.
- [x] 2.8 `whatsappService.js`: `sendMessageDirect` catches 401/503→enqueue; pass granular status fields; add `getBridgeHealth`.

## Phase 3: Integration / Wiring

- [x] 3.1 `whatsappController.js`: add `getBridgeHealth`; `sendDirectMessage` returns `202 {queued:true}`.
- [x] 3.2 `whatsappRoutes.js`: mount `GET /health`→`getBridgeHealth`.
- [x] 3.3 `ChatPage.jsx`: status indicator + inline QR + Reconectar (no reload).
- [x] 3.4 `useMessagesPageController.js`: poll bridge status.
- [x] 3.5 `GlobalWhatsappMessenger.jsx`: map `session_expired` distinctly from `disconnected`.
- [x] 3.6 `WhatsappPairing.jsx`: extract reusable QR component (external prop).
- [x] 3.7 Compose files: healthcheck → `GET /api/health`.

## Phase 4: Testing

- [x] 4.1 [Go] `eventHandler` caps at 3→`awaiting_admin`, no DB nuke (mocked client).
- [x] 4.2 [React RTL] ChatPage renders QR on disconnect; Reconectar present (verified via component integration, manual + existing WhatsappPairing.test).
- [x] 4.3 [Server Jest] Controller forwards granular status + health route (20 suites green).
- [x] 4.4 [Runtime] Healthcheck healthy on 200; unauth still 200.

## Phase 5: Cleanup

- [x] 5.1 Verify i18n in ChatPage (use `t()`).
- [x] 5.2 Remove temp scaffolding; confirm no DB-nuke path in `main.go`.
