# API Reference

Base URL: `http://localhost:5000/api` during local development. The Vite client
proxies `/api` to this URL. Protected endpoints accept either the `token`
`httpOnly` cookie or `Authorization: Bearer <JWT>`.

All non-stream error responses use this shape:

```json
{ "message": "Human-readable error message" }
```

`server/routes/chat.routes.js` and `server/routes/document.routes.js` are
mounted but currently expose no routes.

## Health

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| `GET` | `/health` | No | `200 { "status": "ok", "uptime": 12.34 }` |

```bash
curl http://localhost:5000/api/health
```

## Auth

### `POST /auth/signup`

Creates a user, sets the auth cookie, and returns a user plus JWT.

| Auth | Request body | Success response |
| --- | --- | --- |
| No | `{ "name": "Ada", "email": "ada@example.com", "password": "at-least-8-chars" }` | `201 { "user": { "id", "name", "email", "createdAt" }, "token": "<jwt>" }` |

```bash
curl -i -X POST http://localhost:5000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"securepass"}'
```

### `POST /auth/login`

| Auth | Request body | Success response |
| --- | --- | --- |
| No | `{ "email": "ada@example.com", "password": "securepass" }` | `200 { "user": { "id", "name", "email", "createdAt" }, "token": "<jwt>" }` |

```bash
curl -i -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"securepass"}'
```

### `POST /auth/logout`

| Auth | Request body | Success response |
| --- | --- | --- |
| No | None | `200 { "message": "Logged out." }` |

```bash
curl -i -X POST http://localhost:5000/api/auth/logout
```

### `GET /auth/me`

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | None | `200 { "userId": "<mongo-object-id>" }` |

```bash
curl http://localhost:5000/api/auth/me -H 'Authorization: Bearer <JWT>'
```

## Conversations

Conversation objects have `_id`, `userId`, `title`, `createdAt`, and `updatedAt`.

### `GET /conversations`

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | None | `200 { "conversations": [<conversation>] }` ordered by most recently updated |

```bash
curl http://localhost:5000/api/conversations -H 'Authorization: Bearer <JWT>'
```

### `POST /conversations`

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | `{ "title": "Optional title" }` | `201 { "conversation": <conversation> }` |

Omit `title` to use `New conversation`.

```bash
curl -X POST http://localhost:5000/api/conversations \
  -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' \
  -d '{"title":"Research notes"}'
```

### `PATCH /conversations/:id`

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | `{ "title": "New title" }` (non-empty, max 80 characters) | `200 { "conversation": <conversation> }` |

```bash
curl -X PATCH http://localhost:5000/api/conversations/<CONVERSATION_ID> \
  -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' \
  -d '{"title":"Updated research notes"}'
```

### `DELETE /conversations/:id`

Deletes the owned conversation, its MongoDB messages/documents, and attempts
to remove its Chroma vectors.

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | None | `200 { "message": "Conversation deleted." }` |

```bash
curl -X DELETE http://localhost:5000/api/conversations/<CONVERSATION_ID> \
  -H 'Authorization: Bearer <JWT>'
```

## Messages

A message has `_id`, `conversationId`, `role` (`user` or `assistant`),
`content`, `attachments`, `stopped`, `provider`, `createdAt`, and `updatedAt`.
Provider values are `cohere`, `claude`, `openai`, or `gemini`.

### `GET /conversations/:id/messages`

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | None | `200 { "messages": [<message>] }` in chronological order |

```bash
curl http://localhost:5000/api/conversations/<CONVERSATION_ID>/messages \
  -H 'Authorization: Bearer <JWT>'
```

### `POST /conversations/:id/messages`

Creates a streamed assistant response. The response header is
`Content-Type: text/event-stream`; it is not a JSON response.

| Auth | Request body |
| --- | --- |
| Yes | `{ "content": "What does the document say?", "provider": "cohere" }` |

`content` may also be supplied as `message`. `provider` is optional and
defaults to `cohere`; the selected provider must have its server API key set.

```bash
curl -N -X POST http://localhost:5000/api/conversations/<CONVERSATION_ID>/messages \
  -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' \
  -d '{"content":"Summarize the uploaded document","provider":"openai"}'
```

### `PATCH /conversations/:id/messages/:messageId`

Edits an owned user message and deletes every following message because it was
derived from the old content.

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | `{ "content": "Corrected question" }` | `200 { "message": <updated-message>, "deletedMessageIds": ["..."] }` |

```bash
curl -X PATCH http://localhost:5000/api/conversations/<CONVERSATION_ID>/messages/<MESSAGE_ID> \
  -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' \
  -d '{"content":"Corrected question"}'
```

### `POST /conversations/:id/messages/:messageId/regenerate`

Regenerates for an existing owned user message. It removes the old assistant
branch and emits the same SSE events as a new message.

| Auth | Request body |
| --- | --- |
| Yes | `{ "provider": "gemini" }` (optional; defaults to `cohere`) |

```bash
curl -N -X POST http://localhost:5000/api/conversations/<CONVERSATION_ID>/messages/<MESSAGE_ID>/regenerate \
  -H 'Authorization: Bearer <JWT>' -H 'Content-Type: application/json' \
  -d '{"provider":"gemini"}'
```

### SSE event format

Each event is one SSE `data:` frame containing JSON.

| `type` | Shape | Meaning |
| --- | --- | --- |
| `sources` | `{ "type":"sources", "sources":[{ "text", "documentId", "chunkIndex", "distance" }] }` | Retrieved context before token output. |
| `token` | `{ "type":"token", "text":"..." }` | One generated text delta. |
| `done` | `{ "type":"done", "userMessageId", "assistantMessageId", "provider", "conversationTitle", "stopped" }` | Persistence completed. `assistantMessageId` can be `null` if no text was generated. |
| `error` | `{ "type":"error", "message":"..." }` | Stream/provider error after headers have been sent. |

## Upload

### `POST /upload`

Uploads a conversation-scoped document or OCR image. The multipart field names
are exact: `file` and `conversationId`.

| Auth | Request body | Success response |
| --- | --- | --- |
| Yes | `multipart/form-data`: `file`, `conversationId` | `201 { "status":"processed", "documentId", "chunkCount", "vectorIndexed", "filename" }` |

Allowed file types: PDF, TXT, PNG, JPG/JPEG, WebP, and BMP. The server limit is
10 MiB. `vectorIndexed: false` means the document is still stored and can be
retrieved through the lexical fallback.

```bash
curl -X POST http://localhost:5000/api/upload \
  -H 'Authorization: Bearer <JWT>' \
  -F 'conversationId=<CONVERSATION_ID>' \
  -F 'file=@./example.pdf;type=application/pdf'
```
