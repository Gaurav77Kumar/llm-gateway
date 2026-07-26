# LLM Gateway

A minimal HTTP gateway that sits in front of LLM providers and adds what a team needs to run LLMs safely in production: virtual API keys, per-key token budgets, usage/spend logging, and automatic fallback between providers.

Groq is the primary provider; Gemini is the fallback used when Groq errors or times out.

See [`DECISIONS.md`](./DECISIONS.md) for the full request lifecycle, design rationale, and known limitations, and [`AI-LOG.md`](./AI-LOG.md) for how AI tools were used to build this.

## Features

- **Virtual API keys** — callers authenticate with a gateway-issued key (`sk-gw-...`); the raw provider keys never leave the server.
- **Per-key token budgets** — each key has a token cap. Requests over budget are rejected (`403` on the pre-check, `409` if an atomic race-guard rejects it after the fact).
- **Usage & spend logging** — every request (success, fallback, or error) is persisted with provider, model, tokens in/out, estimated cost, and response time.
- **Fallback** — Groq primary, Gemini fallback on any error; both failing returns a clean `503`.
- **Admin-gated key creation** — issuing new keys requires a shared admin secret, checked with a timing-safe comparison.

## Tech stack

- Node.js / Express
- MongoDB (Mongoose)
- Groq API (primary provider) and Gemini API (fallback provider)

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Groq API key and a Gemini API key

### Install

```bash
git clone https://github.com/Gaurav77Kumar/llm-gateway
cd <llm-gateway>
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model_name

ADMIN_SECRET=a_long_random_string
```

`MONGODB_URI`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `ADMIN_SECRET` are required — 

### Run

```bash
npm start
```

The server starts on `http://localhost:<PORT>` (default `3000`).

## API

### Create a virtual key (admin only)

```
POST /keys
Headers: X-Admin-Secret: <your admin secret>
Body: { "label": "My App Key", "tokenBudget": 10000 }
```

Returns the raw API key exactly once — store it immediately, it cannot be retrieved again.

```bash
curl -X POST http://localhost:3000/keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_admin_secret" \
  -d '{"label": "test key", "tokenBudget": 5000}'
```

### Chat completion

```
POST /chat
Headers: Authorization: Bearer <virtual api key>
Body: { "messages": [{ "role": "user", "content": "Hello" }] }
```

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-gw-..." \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

Response:

```json
{
  "message": "Hi there! How can I help?",
  "provider": "groq",
  "model": "openai/gpt-oss-20b",
  "usage": {
    "tokensIn": 12,
    "tokensOut": 8,
    "totalTokens": 20,
    "estimatedCost": 0.0000039,
    "tokenBudget": 5000,
    "tokensRemaining": 4980
  },
  "fallbackUsed": false
}
```

### Check usage

```
GET /usage
Headers: Authorization: Bearer <virtual api key>
```

Returns aggregated request count, token totals, and estimated cost for the calling key only.

```bash
curl http://localhost:3000/usage \
  -H "Authorization: Bearer sk-gw-..."
```

the fallback policy.




