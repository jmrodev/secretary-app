# Design: WhatsApp Session Drops and AI Suggestion Failures

## Technical Approach
This design addresses session drop persistence issues in the Go WhatsApp Bridge and API routing failures in the AI Suggestion service.
1. **WhatsApp Bridge**: Listen to `*events.LoggedOut` in the Go event handler to cleanly close the connection and delete SQLite session files (`data/examplestore.db*`). Modify `/api/refresh` to unconditionally clean up these files, allowing a clean state for new QR code generation.
2. **AI Suggestion Routing**: Update Node.js `WhatsAppAiService` to conditionally route requests based on model selection and active API keys. Use the native Google Gemini REST API instead of routing Gemini requests to Groq.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Gemini Integration**: Native REST endpoint vs Google Gen AI SDK | Using SDK adds npm dependency. Native REST API (`fetch`) keeps package lightweight and has zero dependency overhead. | **Native REST Endpoint**: Use native `fetch` to POST to Gemini's endpoint, preserving dependency minimalism. |
| **LoggedOut Cleanup**: Active file removal vs flag setting | Deleting DB files requires OS-level file operations but guarantees `whatsmeow` creates a fresh store on restart. Flag setting might leave corrupted files. | **Active File Removal**: Terminate client, disconnect, and call `os.Remove` on all SQLite db files. |

## Data Flow

### WhatsApp Session State Flow
```
User Revokes (Phone) ──> Go Bridge (LoggedOut Event) ──> Disconnect ──> Delete SQLite DB
Frontend Refresh ──────> HTTP POST /api/refresh ────────> Disconnect ──> Delete SQLite DB ──> Build Client ──> Get QR
```

### AI Routing Flow
```
whatsappAiService ──> Check Model/Key ──(model starts with gemini)──> Google Gemini API
                                      └──(else / Groq Key)─────────> Groq API
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| [whatsapp-bridge-go/main.go](file:///home/jmro/Documents/secretary-app/whatsapp-bridge-go/main.go) | Modify | Add `*events.LoggedOut` case in `eventHandler`, clean DB files unconditionally in `handleRefresh`. |
| [server/services/communication/whatsappAiService.js](file:///home/jmro/Documents/secretary-app/server/services/communication/whatsappAiService.js) | Modify | Add routing logic to check for Gemini vs Groq, and use the Google Gemini REST API. |

## Interfaces / Contracts

### Google Gemini API Contract
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
- **Method**: `POST`
- **Request Body**:
```json
{
  "contents": [
    {
      "parts": [{ "text": "Prompt text goes here..." }]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 150,
    "temperature": 0.7
  }
}
```
- **Response Extract Path**: `result.candidates[0].content.parts[0].text`

### SQLite Cleanup Logic on LoggedOut (Go)
```go
case *events.LoggedOut:
	fmt.Printf("Logged out: %s. Cleaning up session...\n", v.Reason)
	clientMu.Lock()
	if client != nil {
		client.Disconnect()
	}
	lastQR = ""
	clientMu.Unlock()
	os.Remove("data/examplestore.db")
	os.Remove("data/examplestore.db-wal")
	os.Remove("data/examplestore.db-shm")
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `whatsappAiService` routing | Mock `fetch` requests. Assert Gemini model calls use Gemini endpoint/headers, and Groq model calls use Groq endpoint/headers. |
| Integration | Go SQLite session cleanup | Trigger mock `LoggedOut` event and assert database files are removed. Call `/api/refresh` and verify SQLite file removal. |

## Threat Matrix
`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout
No migration required.

## Open Questions
- None.
