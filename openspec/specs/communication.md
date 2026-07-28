# Specification: WhatsApp Communication and AI Suggestions

## Purpose

This specification defines the behavior of the WhatsApp Bridge integration and the routing of AI Suggestions. It ensures that invalid WhatsApp sessions are cleanly handled, and that AI suggestions are correctly routed to either Gemini or Groq depending on the configuration and keys.

## Requirements

### Requirement 1: WhatsApp Session Invalidation and Refresh
The WhatsApp Bridge MUST monitor session states and clean up local session databases upon invalidation or manual refresh.
1. The bridge MUST listen for logout/revocation events (e.g., `*events.LoggedOut`).
2. Upon receiving a logout event, the bridge MUST delete its local session database files.
3. The `/api/refresh` endpoint MUST unconditionally delete existing session database files and reset the client state to allow generating a new QR code for pairing.

#### Scenario 1.1: Automatic cleanup on logout event
- GIVEN the WhatsApp Bridge is connected with a session
- WHEN the user revokes the session on their phone or the server receives a `LoggedOut` event
- THEN the bridge MUST terminate the client connection
- AND the bridge MUST delete the local SQLite database file containing session data

#### Scenario 1.2: Manual refresh of invalid/stale session
- GIVEN the bridge is in a disconnected or invalid session state
- WHEN a client sends a POST request to `/api/refresh`
- THEN the bridge MUST delete the session SQLite database file
- AND the bridge MUST reset the client instance
- AND the bridge MUST generate a new pairing QR code

---

### Requirement 2: AI Suggestion Routing and Fallback
The AI Suggestion Service MUST route chat completion requests to the correct provider API based on the active API key and model selection.
1. If the selected model is a Gemini model or a `GEMINI_API_KEY` is active (without a Groq key), the service MUST route the request to the official Gemini API endpoint.
2. If `GROQ_API_KEY` is active, the service MUST route the request to the Groq API endpoint.
3. The service MUST map generic request parameters to the corresponding provider's format.

#### Scenario 2.1: Routing to Gemini API
- GIVEN a `GEMINI_API_KEY` is configured and `GROQ_API_KEY` is absent
- WHEN a user requests an AI suggestion using a gemini model
- THEN the service MUST route the HTTP POST request to the Google Gemini API endpoint
- AND the service MUST use the `GEMINI_API_KEY` for authentication

#### Scenario 2.2: Routing to Groq API with fallback
- GIVEN both a `GROQ_API_KEY` and a `GEMINI_API_KEY` are configured
- WHEN a user requests an AI suggestion using a Groq model
- THEN the service MUST route the HTTP POST request to the Groq API endpoint
- AND the service MUST use the `GROQ_API_KEY` for authentication
