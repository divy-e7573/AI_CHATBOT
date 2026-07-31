# Feature Tracker

This tracker reflects the current implementation. For technical details, see
[ARCHITECTURE.md](ARCHITECTURE.md) and [API.md](API.md).

## Core features

- [x] React/Vite client with landing, login, signup, and protected chat routes
- [x] Conversation creation, listing, selection, rename, and deletion
- [x] Chronological message history
- [x] Streaming assistant responses in the chat UI
- [x] Markdown rendering for assistant messages
- [x] Automatic first-conversation title generation with local fallback
- [x] Manual conversation title editing
- [x] File picker validation for supported files and 10 MiB limit
- [x] Responsive sidebar/drawer UI

## RAG pipeline

- [x] PDF text extraction
- [x] Plain-text file ingestion
- [x] Image OCR for PNG, JPG/JPEG, WebP, and BMP
- [x] Overlapping word-based chunking
- [x] Conversation-scoped document records in MongoDB
- [x] Cohere document/query embeddings
- [x] Chroma vector indexing and retrieval when available
- [x] MongoDB lexical retrieval fallback when vector indexing/retrieval is unavailable
- [x] Retrieved source metadata emitted with a streamed response
- [x] Chroma vector cleanup when a conversation is deleted
- [ ] Document list/delete API or UI independent of conversation deletion

## Auth and security

- [x] Signup with email/password validation and bcrypt hashing
- [x] Login with non-enumerating invalid-credential response
- [x] JWT issuance with seven-day expiry
- [x] `httpOnly`, `sameSite=lax` auth cookie
- [x] Bearer-token fallback in auth middleware
- [x] Protected conversation, message, and upload routes
- [x] Conversation ownership checks before message/upload operations
- [x] API provider keys kept server-side
- [ ] Password reset flow
- [ ] OAuth/Google authentication
- [ ] Rate limiting or request throttling

## Advanced features

- [x] Browser Web Speech API input with interim transcript and silence timeout
- [x] Stop an in-progress response with browser/server abort handling
- [x] Persist partial stopped responses with `stopped: true`
- [x] Edit a sent user message
- [x] Delete downstream messages after editing a user message
- [x] Regenerate a response for an existing user message
- [x] Multi-model selection: Cohere, Claude, GPT, and Gemini
- [x] Provider adapter factory with a common token-stream interface
- [x] Provider label on assistant messages
- [x] Provider choice persisted per conversation in Zustand/local storage
- [ ] Per-message source citation rendering in the chat bubble
- [ ] Server-side speech-to-text endpoint

## Known issues / constraints

- [x] Chroma is optional; MongoDB lexical retrieval is used when it is offline
- [x] Each external provider requires its own configured server API key
- [x] Image uploads are OCR inputs, not direct multimodal prompts to providers
- [x] Voice input depends on browser Web Speech API support and permission
- [ ] There is no automated test script configured in either package
- [ ] Empty `server/routes/chat.routes.js` and `document.routes.js` are mounted but expose no endpoints

## Planned / future work

- [ ] Add automated unit and integration tests for routes and streaming
- [ ] Add provider health/status information to the model selector
- [ ] Add document management endpoints and UI
- [ ] Add configurable retrieval settings and source display
- [ ] Add user/account management beyond login and logout
- [ ] Add production CORS origin configuration and operational observability
