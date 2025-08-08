# Cloudflare AI Worker - GPT-OSS

A production-ready Cloudflare Worker that provides access to OpenAI's GPT-OSS models (`@cf/openai/gpt-oss-120b` and `@cf/openai/gpt-oss-20b`) through REST API endpoints.

## Features

- 🤖 **OpenAI GPT-OSS Models**: Access to both 120B and 20B parameter models
- 📡 **Multiple API Formats**: Supports both Responses API and OpenAI-compatible formats
- 🔧 **Code Interpreter**: Built-in code execution capabilities
- 🌐 **CORS Enabled**: Cross-origin requests supported
- ⚡ **Fast & Scalable**: Powered by Cloudflare's global edge network
- 🔒 **Secure**: No API keys required for basic usage

## API Endpoints

### Health Check
```bash
GET /health
```

Returns service status and available models.

### List Models
```bash
GET /api/v1/models
```

Returns available GPT-OSS models with pricing information.

### Chat (Responses API Format)
```bash
POST /api/v1/chat
Content-Type: application/json

{
  \"model\": \"@cf/openai/gpt-oss-120b\",
  \"input\": \"What are the benefits of open-source models?\",
  \"reasoning\": {\"effort\": \"medium\"},
  \"instructions\": \"You are a helpful AI assistant.\"
}
```

### Chat (OpenAI-Compatible Format)
```bash
POST /api/v1/chat/completions
Content-Type: application/json

{
  \"model\": \"@cf/openai/gpt-oss-120b\",
  \"messages\": [
    {\"role\": \"system\", \"content\": \"You are a helpful assistant.\"},
    {\"role\": \"user\", \"content\": \"Hello!\"}
  ]
}
```

### Code Interpreter
```bash
POST /api/v1/code
Content-Type: application/json

{
  \"input\": \"Calculate the sum of prime numbers from 1 to 100\",
  \"model\": \"@cf/openai/gpt-oss-120b\"
}
```

## Usage Examples

### Basic Chat
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"input\": \"Explain quantum computing in simple terms\"
  }'
```

### Chat with Custom Instructions
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"input\": \"What is machine learning?\",
    \"instructions\": \"You are an expert data scientist. Explain concepts clearly with examples.\",
    \"reasoning\": {\"effort\": \"high\"}
  }'
```

### OpenAI-Compatible Format
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat/completions \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"messages\": [
      {\"role\": \"system\", \"content\": \"You are a helpful assistant.\"},
      {\"role\": \"user\", \"content\": \"Write a Python function to calculate fibonacci numbers\"}
    ]
  }'
```

### Code Interpreter
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/code \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"input\": \"Create a Python script that analyzes this dataset: [1,2,3,4,5,6,7,8,9,10] and calculates mean, median, and standard deviation\"
  }'
```

### List Available Models
```bash
curl https://ai-worker.emily-cogsdill.workers.dev/api/v1/models
```

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