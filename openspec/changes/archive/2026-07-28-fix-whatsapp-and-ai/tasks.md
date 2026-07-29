# Tasks: WhatsApp Session Drops and AI Suggestions Fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Go session cleanup and Node.js AI routing | PR 1 | `go test ./...` & `pnpm --filter server test` | Run bridge and check SQLite file deletion on logout / refresh | Revert `main.go` and `whatsappAiService.js` |

## Phase 1: Go Bridge Session Cleanup

- [x] 1.1 Add `*events.LoggedOut` case in `eventHandler` in [whatsapp-bridge-go/main.go](file:///home/jmro/Documents/secretary-app/whatsapp-bridge-go/main.go) to disconnect client and remove files `data/examplestore.db`, `data/examplestore.db-wal`, and `data/examplestore.db-shm`.
- [x] 1.2 Update `handleRefresh` in [whatsapp-bridge-go/main.go](file:///home/jmro/Documents/secretary-app/whatsapp-bridge-go/main.go) to unconditionally call the cleanup file removal code and re-initialize client.
- [x] 1.3 Add a unit test in Go (`main_test.go`) that triggers a simulated logout event and asserts that SQLite session database files are successfully deleted.

## Phase 2: Node.js AI Suggestion Routing

- [x] 2.1 Update [server/services/communication/whatsappAiService.js](file:///home/jmro/Documents/secretary-app/server/services/communication/whatsappAiService.js) to inspect model selection and configured API keys.
- [x] 2.2 Implement the native Google Gemini REST API request logic using `fetch` inside `whatsappAiService.js`.
- [x] 2.3 Add unit tests in Jest mocking `fetch` to assert Gemini endpoints are called for gemini models and Groq endpoints are called for groq models.

## Phase 3: Verification & Integration

- [x] 3.1 Run Go test suite to verify Go event handler and refresh endpoint SQLite cleanup.
- [x] 3.2 Run `pnpm --filter server test` to verify Gemini/Groq request routing under mocked fetch responses.
- [x] 3.3 Verify full integration end-to-end using frontend controls to refresh sessions and trigger AI suggestions.
