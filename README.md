# Citrus Backend

Production-ready backend for a Stack Overflow-like platform with:

- Node.js + Express.js
- MongoDB + Mongoose
- JWT auth + bcrypt password hashing
- Questions, answers, voting, tags, search, and user reputation
- Socket.io real-time 1-to-1 chat
- AI endpoint with modular RAG-ready pipeline

## Tech Stack

- `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`
- `socket.io`
- `express-validator`
- `helmet`, `cors`, `compression`, `morgan`
- `openai`

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Health check:

```bash
GET /health
```

## Environment Variables

See `.env.example`.

Required keys:

- `MONGO_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY` (optional for AI endpoint; without it, mock fallback is returned)

## Architecture

Layered flow:

`Routes -> Middleware -> Controllers -> Services -> Models (Mongoose)`

Main folders:

- `src/config` DB and third-party clients
- `src/models` Mongoose schemas
- `src/controllers` HTTP handlers
- `src/services` business logic
- `src/middleware` auth, validation, logging, errors
- `src/sockets` real-time chat events
- `src/routes` API route modules
- `src/services/rag` modular AI + RAG pipeline

## API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Questions

- `GET /questions` (pagination, filtering, search, sort)
- `GET /questions/:id`
- `POST /questions`
- `PATCH /questions/:id`
- `DELETE /questions/:id`
- `POST /questions/:id/vote` body: `{ "voteType": "upvote" | "downvote" }`

Query support for `GET /questions`:

- `page`, `limit`
- `search`
- `tags` (comma-separated or repeated from frontend)
- `askedBy`
- `sortBy` (`newest`, `oldest`, `votes`, `answers`)

### Answers

- `GET /answers/question/:questionId`
- `POST /answers`
- `PATCH /answers/:id`
- `DELETE /answers/:id`
- `POST /answers/:id/vote`

### Users

- `GET /users/me`
- `GET /users/:id`

### AI

- `POST /ai/chat` body: `{ "question": "...", "useRetrieval": true }`

### Chat

- `GET /chat`
- `POST /chat/start`
- `GET /chat/:chatId/messages`
- `POST /chat/:chatId/messages`

## Socket.io Events

- `connect`
- `joinRoom`
- `sendMessage`
- `receiveMessage`
- `disconnect`
- `typing` (typing indicator helper event)

Authentication:

- Pass JWT in `socket.handshake.auth.token` or `Authorization: Bearer <token>`.

## Scripts

- `npm run dev` run in watch mode
- `npm start` run in production mode
- `npm run seed` seed sample data
- `npm run embed:data` generate dry-run embeddings for future vector upsert

## Notes

- Role support (`user`, `admin`) is built-in.
- Ownership checks are enforced for question/answer edit-delete actions.
- Private routes are protected by JWT middleware.
- Centralized validation and error handling are enabled.
- RAG services are modular and ready for Pinecone/vector integration in Phase 2.
