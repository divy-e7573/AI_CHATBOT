# Architecture

This document describes the implemented application structure. Endpoint-level
contracts are in [API.md](API.md); local prerequisites are in [SETUP.md](SETUP.md).

## System overview

The application is a React/Vite client and an Express API backed by MongoDB.
Chat requests retrieve conversation-scoped document chunks, then stream a
provider response to the browser using Server-Sent Events (SSE). ChromaDB is an
optional vector index; MongoDB lexical retrieval remains available when Chroma
or vector embedding is unavailable.

```text
+----------------------- Presentation ------------------------+
| React + Vite                                                   |
| Home/Auth pages | ChatWindow | Sidebar | Zustand stores        |
| File upload | Web Speech API | fetch-based SSE reader          |
+------------------------------+--------------------------------+
                               | /api (cookie or Bearer JWT)
+------------------------------v--------------------------------+
| Express API                                                    |
| auth routes | conversation/message routes | upload route       |
| auth middleware | Multer validation | controllers              |
+-------------+---------------------+---------------------------+
              |                     |
              |                     +-----------------------------+
              |                                                   |
+-------------v----------------+                    +-------------v----------+
| Persistence                  |                    | RAG / retrieval         |
| MongoDB                      |                    | extract -> chunk        |
| Users, Conversations,        |                    | Cohere embeddings       |
| Messages, Documents/chunks   |                    | Chroma vector search    |
+------------------------------+                    | Mongo lexical fallback  |
                                                    +-------------+----------+
                                                                  |
                                                    +-------------v----------+
                                                    | Generation adapters     |
                                                    | Cohere | Claude | GPT   |
                                                    | Gemini -> token stream  |
                                                    +------------------------+
```

## Core modules

### Auth

`server/controllers/authController.js` creates users with bcrypt password
hashes, signs seven-day JWTs, and sets an `httpOnly` cookie. The client also
keeps the returned token in its persisted Zustand auth store and sends it as a
Bearer header; `authMiddleware` accepts either credential form. Protected API
controllers scope reads and writes to `req.userId`.

### Conversation management

`Conversation`, `Message`, and their controllers implement creation, listing,
renaming, retrieval of chronological messages, and deletion. A deletion also
removes Mongo messages/documents and attempts Chroma vector cleanup. The first
completed response can receive an AI-generated title, with a local title
fallback. `Sidebar` and `chatStore` provide the client state and controls.

### Document ingestion

`POST /api/upload` uses Multer to accept PDF, TXT, PNG, JPG/JPEG, WebP, and BMP
files up to 10 MiB. `textExtractor` parses PDFs, reads text files, and performs
English OCR for images. `chunker` creates overlapping word chunks. The original
temporary file is removed after processing; extracted chunks are stored in the
MongoDB `Document` record.

### Retrieval

`ragService` uses Cohere embeddings and stores vectors in a shared Chroma
collection with conversation metadata. Retrieval is always scoped to the active
conversation. If Chroma or embedding is unavailable—or a document was stored
without vectors—the service uses its MongoDB lexical fallback. The top four
chunks are placed in the generation context and also sent to the client as
`sources` SSE data.

### Generation and streaming

`chatController` owns the common message pipeline: retrieve chunks, build a
grounded preamble, retain up to six prior messages, stream tokens, and persist
the result. It emits `sources`, `token`, `done`, and `error` SSE messages. A
server-side `AbortController` reacts to client disconnects; partial text is
saved with `stopped: true`.

### Voice input

`useSpeechToText` wraps the browser Web Speech API. It supports interim text,
microphone/browser errors, an optional on-device recognition attempt, and an
automatic silence timeout. This is browser-side transcription; there is no
speech-to-text API route.

### Multi-model provider adapters

`server/services/aiProviders/` exposes a common async generator interface:

```js
streamChat({ messages, context, signal })
```

The factory accepts `cohere`, `claude`, `openai`, and `gemini` (plus a few
aliases), checks that the corresponding server environment key exists, and
returns an adapter. Each adapter translates the shared messages/context into
its provider API and yields plain text tokens. `Message.provider` records the
chosen provider. The client stores the active provider per conversation in
Zustand and sends it on both normal and regenerate requests.

## Data flows

### A. Normal chat message

1. `ChatWindow` adds optimistic user/assistant entries and POSTs content plus
   the selected provider.
2. Auth middleware identifies the user; the controller verifies conversation
   ownership and provider configuration.
3. Retrieval finds up to four matching chunks for the conversation. The
   controller constructs a prompt from those chunks and recent history.
4. The selected adapter streams text tokens. The API relays them as SSE and
   the client appends them to the optimistic assistant bubble.
5. The API stores the user and assistant messages, updates the conversation
   timestamp/title, and sends a final `done` event with persisted IDs.

### B. Document upload and grounded question

1. The client sends multipart `file` and `conversationId` to `/api/upload`.
2. The API checks authentication, file type/size, and conversation ownership.
3. Text is extracted (OCR for images), chunked, saved in MongoDB, and indexed
   in Chroma when available.
4. A later chat message retrieves the most relevant chunks from Chroma or the
   lexical fallback and inserts them into the provider context.
5. The browser receives both the response tokens and source metadata. The
   model instructions request bracket-number citations when context is used.

### C. Edit and regenerate

1. Editing a user message calls the PATCH endpoint. The API updates that
   message and deletes every later message in the conversation.
2. The client automatically POSTs the regenerate endpoint for the edited user
   message, using its selected provider.
3. For explicit regeneration, the API removes the old assistant/downstream
   branch, retrieves fresh context, and streams a replacement response.
4. The existing user message is retained, its provider is updated to the
   current selection, and the generated assistant message is persisted.

## Design decisions

| Decision | Reason |
| --- | --- |
| Adapter pattern for providers | Keeps retrieval, persistence, cancellation, and browser SSE independent of provider-specific SDK/SSE shapes. |
| SSE over WebSocket | The response is a one-way token stream for an existing HTTP POST; `fetch` plus a readable stream supports JSON bodies and auth headers. |
| MongoDB as durable RAG source | Documents/chunks remain searchable when optional vector infrastructure is unavailable. |
| Chroma as optional index | Vector search improves semantic retrieval without making upload or chat unavailable during an outage. |
| JWT cookie plus Bearer fallback | Browser requests can use an `httpOnly` cookie, while the API remains usable by clients that send an Authorization header. |
| Per-conversation provider preference | Switching models in one chat does not silently change another chat; preferences survive refresh through the chat store persistence. |
| Partial-response persistence | A stopped stream is still valid conversational history instead of an orphaned/loading UI state. |
