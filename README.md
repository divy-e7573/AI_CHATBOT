An AI-powered chatbot built using modern LLM technologies with Retrieval-Augmented Generation (RAG) for context-aware responses. Supports intelligent document and OCR image retrieval, conversational memory, and natural language interactions to deliver accurate, knowledge-grounded answers.

# AI Chatbot (MERN + RAG)

MERN stack skeleton for an AI chatbot with RAG (Retrieval-Augmented Generation) support.

## Structure

```
/
├── client/                 # React + Vite frontend
│   └── src/
├── server/                 # Express backend
│   ├── config/             # DB connection, etc.
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, error handling, uploads
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic, AI/RAG integration
│   └── server.js           # App entry point
├── .env.example
└── .gitignore
```

## Getting started

### Server

```bash
cd server
npm install
cp ../.env.example .env   # then fill in the values
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

## Environment variables

See [.env.example](.env.example):

| Variable     | Description                                  |
| ------------ | -------------------------------------------- |
| `PORT`       | Port the Express server listens on           |
| `MONGO_URI`  | MongoDB connection string                    |
| `JWT_SECRET` | Secret for signing JWT auth tokens           |
| `COHERE_API_KEY` | Cohere key for chat and optional vector embeddings |
| `CHROMA_URL` | Optional Chroma URL (MongoDB fallback is automatic) |
