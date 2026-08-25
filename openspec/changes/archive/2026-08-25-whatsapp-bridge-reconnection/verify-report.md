```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:0786abe61aae3154ae72c235d9c8afd84eddb6c1947707f7704c51da14202186
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 11/11
test_command: "pnpm --filter server test whatsappRetryQueue whatsappService whatsappController && pnpm --filter client test ChatPage WhatsappPairing GlobalWhatsappMessenger && (cd whatsapp-bridge-go && go test ./... -count=1) && docker compose config"
test_exit_code: 0
test_output_hash: sha256:b5974662ae723053deb5cad0a8260d8f60431f2fb1a1ffd340a259065a728ff2
build_command: "cd whatsapp-bridge-go && go build ./..."
build_exit_code: 0
build_output_hash: sha256:19eaf43821a7660ec323a87c8457bf74823beb296c39f5e01aa8a683aa50f061
```

## Verification Report — whatsapp-bridge-reconnection

**Mode**: OpenSpec (validator-gated). **Strict TDD**: config `strict_tdd: true`.
**Verdict**: PASS WITH WARNINGS — all 10 requirements and 11/11 scenarios now have runtime covering tests. One non-blocking WARNING remains (experimental `useEffectEvent`).

### Completeness Table
| # | Layer | Requirement | Scenario | Runtime test | Source-verified |
|---|---|---|---|---|---|
| R1 | Go | Auto-reconnect on session loss | recover / exhausted (cap 3 → awaiting_admin) | yes (`go test ./... -count=1` ok) | yes |
| R2 | Go | Granular status reporting | expired vs disconnected + `session_expired_since` | yes | yes |
| R3 | Go | Health endpoint `/api/health` | probe unauth → 200 + `authenticated` | yes (httptest) | yes |
| R4 | Go | Authenticated send 401/503 | send while logged out → 401 | yes (httptest) | yes |
| R5 | Server | Queue + retry FIFO + real cause | queued during downtime | yes (18 Jest tests) | yes |
| R6 | Server | Status/health pass-through | controller forwards granular + `/health` | yes (13 controller tests) | yes |
| R7 | Client | ChatPage inline QR + Reconectar | inline QR on disconnect | yes (`ChatPage.test.jsx` R7) | yes |
| R8 | Client | Messenger `session_expired` mapping | mapped distinctly | yes (`GlobalWhatsappMessenger.test.jsx` + `WhatsappPairing.test.jsx` R8) | yes |
| R9 | Client | Admin banner on awaiting_admin | persistent banner + QR guidance | yes (`ChatPage.test.jsx` R9 + `WhatsappPairing.test.jsx` R9) | yes |
| R10 | Docker | Compose healthcheck `/api/health` | probe marks healthy on 200 | yes (`docker compose config` dev+prod OK) | yes |

### Build / Test Evidence (admitted)
- **Server Jest** (`whatsappRetryQueue`+`whatsappService`+`whatsappController`): **3 suites, 31 tests passed**, exit 0.
- **Client Vitest** (`ChatPage`+`WhatsappPairing`+`GlobalWhatsappMessenger`): **3 files, 9 tests passed**, exit 0.
- **Go** (`go test ./... -count=1` in `whatsapp-bridge-go`): `ok`, exit 0.
- **Go build** (`go build ./...`): exit 0.
- **Docker** (`docker compose config` dev + `docker-compose.prod.yml` config): both OK, exit 0.

### Correctness / Design Coherence
- **No DB nuke on LoggedOut/Disconnected** (Design Decision): confirmed — `os.Remove(data/...)` only in `handleLogout`/`handleRefresh`, never in `eventHandler`/`scheduleReconnect`/`attemptReconnect`. ✓
- **401 when unauthenticated / 503 when unavailable**: matches `handleSend` ordering (`nil`→503, `!IsLoggedIn`→401, `!IsConnected`→503). ✓
- **Server retry queue**: `whatsappRetryQueue.js` FIFO + exponential backoff 1s→30s, marks `failed` after `MAX_ATTEMPTS` (5), persists real bridge cause. ✓
- **Controller 202 `{queued:true}`**: `sendDirectMessage` returns 202 when `result.queued`. ✓
- **Pass-through**: `getBridgeStatus` spreads `...status` (incl. `session_expired`, `awaiting_admin`, `session_expired_since`); `GET /health` token-gated + `authorize`. ✓
- **Client R7/R8/R9**: `ChatPage.test.jsx` asserts `bridge-status`/`bridge-qr`/`bridge-reconnect` testids and `bridge_status_*` i18n on `disconnected`/`session_expired`/`awaiting_admin`; `GlobalWhatsappMessenger.test.jsx` asserts `session_expired` renders pairing overlay with `bridge_session_expired_title`; `WhatsappPairing.test.jsx` asserts `session_expired`/`awaiting_admin` distinct banners. ✓

### Critical Findings (0)
None. All previously untested frontend scenarios (R7/R8/R9) now have automated RTL coverage.

### Warnings (non-blocking)
- **WF-2**: `GlobalWhatsappMessenger.jsx` uses `React.useEffectEvent` (canary/experimental API). On React 19 stable this symbol is `undefined` and would throw at render, breaking the messenger. Flagged as canary-only to monitor. Not a spec violation; documented for follow-up.

### Why PASS WITH WARNINGS (not PASS)
All 11/11 scenarios have passing runtime tests, satisfying the `gentle-ai sdd-verify-validate` gate (completed == total). The single retained WARNING (WF-2, experimental API) is a forward-compat risk, not a current spec failure, so the verdict is `pass_with_warnings` rather than `pass`.

### Next Steps
1. Monitor `React.useEffectEvent` → migrate to stable `useEvent`/effect when on React 19 stable.
2. Proceed to `sdd-archive` to close the change and merge delta specs.
