# Cloudflare AI Worker - GPT-OSS

Production-ready Cloudflare Worker providing access to OpenAI's GPT-OSS models.

## Features

- Access to GPT-OSS models (120B and 20B parameters)
- Multiple API formats (Responses API and OpenAI-compatible)
- Conversation history support
- Code interpreter capabilities
- CORS enabled
- **AI Gateway Integration**: Caching, rate limiting, analytics, and fallback support

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

### With AI Gateway Cache Control
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Generate a random creative story",
    "gateway": {
      "skipCache": true,
      "cacheTtl": 0
    }
  }'
```

### OpenAI-Compatible Format
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant"},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

For more examples including code interpreter, custom instructions, and error handling, see [.project/docs/example_curls.md](.project/docs/example_curls.md).

## Available Models

| Model | Parameters | Context Window | Use Case |
|-------|------------|----------------|----------|
| `@cf/openai/gpt-oss-120b` | 120B | 128,000 tokens | Production, general purpose, high reasoning |
| `@cf/openai/gpt-oss-20b` | 20B | 128,000 tokens | Faster responses, lighter workloads |

## Response Formats

### Responses API Format
The native format used by GPT-OSS models:
```json
{
  \"response\": \"AI response content\",
  \"reasoning\": {...},
  \"metadata\": {...}
}
```

### OpenAI-Compatible Format
Standard OpenAI chat completions format:
```json
{
  \"id\": \"chatcmpl-123\",
  \"object\": \"chat.completion\",
  \"created\": 1677652288,
  \"model\": \"@cf/openai/gpt-oss-120b\",
  \"choices\": [{
    \"index\": 0,
    \"message\": {
      \"role\": \"assistant\",
      \"content\": \"AI response content\"
    },
    \"finish_reason\": \"stop\"
  }]
}
```

## AI Gateway Configuration

This Worker integrates with Cloudflare AI Gateway for enhanced monitoring and control:

### Gateway Features
- **Caching**: Reduce costs by caching identical requests (default: 1 hour TTL)
- **Analytics**: Track token usage, request counts, and costs in the AI Gateway dashboard
- **Rate Limiting**: Control request rates (configured in AI Gateway dashboard)
- **Fallback**: Automatic model fallback support

### Cache Control Options

#### Default Caching
By default, responses are cached for 1 hour (3600 seconds):
```json
{
  "input": "What is the capital of France?"
}
```

#### Skip Cache
For dynamic/personalized responses, skip the cache:
```json
{
  "input": "Generate a random story",
  "gateway": {
    "skipCache": true
  }
}
```

#### Custom Cache TTL
Set a custom cache duration (in seconds):
```json
{
  "input": "What's the weather like?",
  "gateway": {
    "cacheTtl": 300  // Cache for 5 minutes
  }
}
```

### Gateway Setup

1. Create an AI Gateway in your Cloudflare dashboard
2. Update `wrangler.toml` with your gateway ID:
   ```toml
   [vars]
   AI_GATEWAY_ID = "your-gateway-id"
   ```
3. Deploy your worker to activate the gateway integration

### Gateway Dashboard
Monitor your AI usage at: https://dash.cloudflare.com/?to=/:account/ai/ai-gateway

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