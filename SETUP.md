# Local Setup

See [ARCHITECTURE.md](ARCHITECTURE.md) for service roles and [API.md](API.md)
for request examples.

## Prerequisites

- Node.js compatible with the project dependencies (Node 18+ is recommended)
- npm
- MongoDB running locally or a reachable MongoDB connection string
- A Cohere API key for the default chat provider and embeddings
- Optional: the Chroma `chroma` CLI if vector indexing is required
- Optional provider keys for Claude, GPT, or Gemini

## Clone and install

```bash
git clone <repository-url>
cd AI_CHATBOT

cd server
npm install

cd ../client
npm install
```

## Configure the server environment

Create `server/.env` from the root example (the server loads `.env` from its
working directory):

```bash
cd server
copy ..\.env.example .env
```

On macOS/Linux, use `cp ../.env.example .env` instead. Set these values in
`server/.env`; do not put provider keys in the client.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | Express port; default is `5000`. |
| `MONGO_URI` | Yes | MongoDB connection string, for example a local database URI. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs. Use a long random value. |
| `COHERE_API_KEY` | Yes for default chat/RAG embeddings | Cohere key used by the default chat provider and embedding service. |
| `CHROMA_URL` | No | Chroma URL; defaults to `http://localhost:8000`. |
| `ANTHROPIC_API_KEY` | No | Enables Claude in the model selector. |
| `OPENAI_API_KEY` | No | Enables GPT in the model selector. |
| `GEMINI_API_KEY` | No | Enables Gemini in the model selector. |
| `ANTHROPIC_MODEL` | No | Optional Claude model override. |
| `OPENAI_MODEL` | No | Optional OpenAI model override. |
| `GEMINI_MODEL` | No | Optional Gemini model override. |

Do not commit `.env` files. The repository ignores them by default.

## Start MongoDB

Use an existing MongoDB instance, or start a local server in a separate
terminal. One example for a local installation is:

```bash
mongod --dbpath <path-to-mongodb-data>
```

Set `MONGO_URI` to the address of the running instance. The default example is
`mongodb://localhost:27017/ai_chatbot`.

## Start Chroma (optional)

The application continues to work without Chroma: uploads are stored in
MongoDB and retrieval falls back to lexical search. To enable vector indexing,
ensure the Chroma CLI is installed and available on `PATH`, then run from the
server directory:

```bash
npm run chroma
```

This starts Chroma with `./chroma-data` on port `8000`, matching the example
`CHROMA_URL`. Leave it running in a separate terminal.

## Start the development servers

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Open the Vite URL shown in Terminal 2 (normally `http://localhost:5173`). Vite
proxies `/api` requests to `http://localhost:5000`.

## Production client build

```bash
cd client
npm run build
```

The output is written to `client/dist/`. Serving that output is not configured
by the Express server in this repository; deploy it with an appropriate static
host or web server.

## Troubleshooting

### MongoDB connection error

- Verify MongoDB is running and `MONGO_URI` is reachable from the server.
- Check that the database host/port and any credentials in the URI are valid.
- Start the server from `server/` so it loads `server/.env`.

### Missing API key or disabled model

- The model selector can show Claude, GPT, Gemini, and Cohere, but a selected
  provider requires its matching environment variable on the server.
- Add the key to `server/.env`, then restart the server.
- `COHERE_API_KEY` is also required for vector embeddings when Chroma indexing
  is in use.

### Chroma is not running

- This is non-fatal. Uploads report `vectorIndexed: false` and chat uses the
  MongoDB lexical retrieval fallback.
- To restore vector search, start Chroma and confirm `CHROMA_URL` points to it.
- Newly uploaded documents will be vector-indexed while Chroma is available;
  documents saved without vectors continue to use fallback retrieval.

### Upload is rejected

- Ensure the file is PDF, TXT, PNG, JPG/JPEG, WebP, or BMP.
- Keep it at or below 10 MiB.
- Confirm that `conversationId` refers to a conversation owned by the signed-in
  user.

### Voice input is unavailable

- Allow microphone permission in the browser.
- Use a browser that exposes the Web Speech API. The app shows a disabled
  control when the API is not supported.
