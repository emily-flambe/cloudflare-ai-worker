# GPT-OSS Worker

A minimal Cloudflare Worker implementation using OpenAI's GPT-OSS models.

## Available Models
- `@cf/openai/gpt-oss-120b` (default) - 120B parameter model
- `@cf/openai/gpt-oss-20b` - 20B parameter model

## Endpoints

### Health Check
```bash
curl https://your-worker.your-domain.workers.dev/health
```

### Chat Completion
```bash
curl -X POST https://your-worker.your-domain.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "model": "@cf/openai/gpt-oss-120b",
    "reasoning": {"effort": "medium"}
  }'
```

## Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```