# Changelog

All notable implemented changes are listed here in reverse chronological order.
Version labels describe project milestones; the package manifests currently
remain at `1.0.0`.

## v0.7.0 — Multi-model support

- Added Cohere, Claude, GPT/OpenAI, and Gemini provider adapters.
- Added a provider factory and a shared async token-stream interface.
- Added provider selection per conversation in the chat UI and persisted that
  preference in the chat store.
- Stored the selected provider on messages and displayed it on assistant
  responses.
- Added server-side provider key validation and optional provider environment
  variables.

## v0.6.0 — Message edit and regeneration

- Added editing for user messages.
- Removed downstream messages after an edit to prevent stale branches.
- Added regeneration for an existing user message with streamed replacement
  output.
- Added a regeneration control on the latest assistant message.

## v0.5.0 — Stop generation

- Added browser `AbortController` support for in-progress streams.
- Added a Stop generating control while a response is active.
- Added server disconnect handling and persistence of partial stopped output.

## v0.4.0 — Voice input and document OCR

- Added browser Web Speech API input with interim text and silence timeout.
- Added image upload support and local English OCR extraction.
- Added client/server file validation for PDF, TXT, PNG, JPG/JPEG, WebP, and
  BMP uploads.

## v0.3.0 — RAG pipeline and streaming chat

- Added document extraction, overlapping chunking, Cohere embeddings, and
  Chroma vector indexing.
- Added conversation-scoped retrieval and a MongoDB lexical fallback.
- Added RAG-grounded prompt construction and source SSE events.
- Added streamed provider output and persisted chat messages.
- Added automatic/fallback conversation titles.

## v0.2.0 — Authentication and conversation management

- Added signup, login, logout, JWT issuance, and `httpOnly` auth cookies.
- Added protected route middleware with Bearer-token fallback.
- Added MongoDB user, conversation, message, and document models.
- Added conversation create/list/rename/delete and message history endpoints.

## v0.1.0 — Initial MERN skeleton

- Added Express server and React/Vite client structure.
- Added environment configuration, MongoDB connection setup, and API proxying.
- Added initial landing, auth, and protected chat page structure.
