# Exploration: WhatsApp Bridge Session Drops and AI Suggestion Failures

This document analyzes the root causes of the WhatsApp bridge session dropping and the AI suggestion failures, proposing solutions along with their pros and cons.

---

## 1. WhatsApp Bridge Session Drops

### Root Causes
1. **Unconditional Re-connection Attempts on Invalid Sessions:**
   In [whatsapp-bridge-go/main.go](file:///home/jmro/Documents/secretary-app/whatsapp-bridge-go/main.go#L176-L216), if `c.Store.ID != nil`, the bridge assumes there is a valid, active session and calls `c.Connect()`. If the session was revoked or invalidated on the user's phone, the connection will fail, but the store files are never cleaned up.
2. **Broken Session Cleanup in Refresh Endpoint:**
   In [whatsapp-bridge-go/main.go:L221-L256](file:///home/jmro/Documents/secretary-app/whatsapp-bridge-go/main.go#L221-L256), the `/api/refresh` handler only deletes SQLite database files if:
   ```go
   if client == nil || client.Store.ID == nil {
       os.Remove("data/examplestore.db")
       ...
   }
   ```
   If there is an invalid/stale session, `client.Store.ID` is **not** `nil`. Thus, the database is never cleared, preventing the bridge from starting a clean pairing process and generating a new QR code.
3. **Lack of Event Handling for Disconnections and Revocation:**
   The `eventHandler` in [whatsapp-bridge-go/main.go:L35-L68](file:///home/jmro/Documents/secretary-app/whatsapp-bridge-go/main.go#L35-L68) only listens to message events. It ignores `*events.LoggedOut` and connection-loss events, meaning it cannot automatically clean up invalid sessions or update status when disconnected.

### Proposed Solutions

#### Option A: Improve session cleanup logic in the Go Bridge
- Modify `handleRefresh` to delete DB files unconditionally or when the client is disconnected/unpaired.
- Listen for `*events.LoggedOut` in `eventHandler` and delete DB session files when it is triggered.
* **Pros:** Keeps logic simple; fixes the core bug where stale database files lock the pairing flow.
* **Cons:** Still relies on polling `/api/status` from the node service.

#### Option B: Auto-reconnect and health checks in the Bridge
- Implement an automated ping or connection state listener. If a disconnection event occurs, attempt to reconnect or mark the state as `disconnected` and clear `lastQR`.
* **Pros:** Real-time state management.
* **Cons:** Requires a more complex Go state machine.

---

## 2. AI Integrated Suggestion Failures

### Root Causes
1. **Incorrect API Routing for `GEMINI_API_KEY`:**
   In [server/services/communication/whatsappAiService.js:L20-L38](file:///home/jmro/Documents/secretary-app/server/services/communication/whatsappAiService.js#L20-L38), the code checks for `GROQ_API_KEY` and falls back to `GEMINI_API_KEY`:
   ```javascript
   const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
   ```
   However, it sends the request unconditionally to the **Groq API endpoint**:
   ```javascript
   const url = 'https://api.groq.com/openai/v1/chat/completions';
   ```
   If a `GEMINI_API_KEY` is provided, the Groq API returns a `401 Unauthorized` error because it is not a valid Groq key.
2. **Incomplete Model Mapping:**
   If the model starts with `gemini`, it replaces the model name with `llama-3.3-70b-versatile` but still queries Groq.

### Proposed Solutions

#### Option A: Conditional API routing based on the API Key/Model
- Separate the network calls:
  - If `GEMINI_API_KEY` is present and selected (or if model is a Gemini model), route the request to the official Gemini API endpoint (`https://generativelanguage.googleapis.com/v1beta/models/...`) or use the Google Gen AI SDK.
  - Otherwise, route to Groq.
* **Pros:** Correctly utilizes each service provider's API with their respective keys and capabilities.
* **Cons:** Slightly more complex conditional code in the AI service.

#### Option B: Standardize on an OpenAI-compatible interface or proxy
- Use an abstract provider client that configures base URLs and headers appropriately for Groq vs Gemini.
* **Pros:** Highly scalable if more providers are added.
* **Cons:** Overkill for a simple two-provider setup.
