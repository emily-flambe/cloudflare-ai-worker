# Cloudflare AI Worker - GPT-OSS

Production-ready Cloudflare Worker providing access to GPT-OSS models via Cloudflare AI.

## Features

- Access to GPT-OSS models (120B and 20B parameters)
- Native Cloudflare AI Responses API format
- Conversation history support
- Code interpreter capabilities
- CORS enabled

## Quick Start

### Basic Usage
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"input": "What is quantum computing?"}'
```

### With Conversation History
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What was my previous question?",
    "conversationHistory": [
      {"role": "user", "content": "What is quantum computing?"},
      {"role": "assistant", "content": "Quantum computing uses quantum mechanics..."}
    ]
  }'
```


For more examples including code interpreter, custom instructions, and error handling, see [.project/docs/example_curls.md](.project/docs/example_curls.md).

## Available Models

| Model | Parameters | Context Window | Use Case |
|-------|------------|----------------|----------|
| `@cf/openai/gpt-oss-120b` | 120B | 128,000 tokens | Production, general purpose, high reasoning |
| `@cf/openai/gpt-oss-20b` | 20B | 128,000 tokens | Faster responses, lighter workloads |

## Response Format

The API uses the native Cloudflare AI Responses format:
```json
{
  "response": "AI response content",
  "reasoning": {...},
  "metadata": {...}
}
```

## Development

### Setup
```bash
npm install
```

### Local Development
```bash
npm run dev
```

### Deploy
```bash
npm run deploy
```

### TypeScript Check
```bash
npm run typecheck
```

## Architecture

Built with:
- **Wrangler 4.28.1** (latest)
- **TypeScript** with strict typing
- **Cloudflare Workers AI** binding
- **Modern async/await** patterns
- **Comprehensive error handling**

## Error Handling

All endpoints return structured error responses:
```json
{
  \"error\": \"Error description\",
  \"details\": \"Additional error information\"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `404` - Endpoint not found
- `500` - Internal server error

## Deployment URL

Production: **https://ai-worker.emily-cogsdill.workers.dev**

## License

MIT License