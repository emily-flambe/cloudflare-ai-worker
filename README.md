# Cloudflare AI Worker API

A production-ready AI API service built with Cloudflare Workers that provides OpenAI-compatible endpoints powered by GPT-OSS models for chat completions, text completions, embeddings, and more.

## Features

- 🤖 **AI Endpoints**: Chat, completion, embedding, and model listing
- 🔐 **Authentication**: Bearer token-based API key authentication
- 🚦 **Rate Limiting**: Configurable rate limits with KV storage
- 🌐 **CORS Support**: Cross-origin request handling
- 📊 **Logging**: Structured logging with request/response tracking
- 🧪 **Testing**: Comprehensive test suite with Vitest
- 🚀 **CI/CD**: GitHub Actions deployment pipeline
- 📝 **TypeScript**: Full TypeScript support with strict typing

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-worker-api
npm install
```

### 2. Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Generate an API key:

```bash
npm run generate-api-key
```

Update `wrangler.toml` with your configuration:

```toml
name = "ai-worker-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[ai]
binding = "AI"

[[secrets_store]]
binding = "SECRETS_STORE"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id"  # Replace with your KV namespace ID

[vars]
ALLOWED_ORIGINS = "*"
RATE_LIMIT_REQUESTS = "100"
RATE_LIMIT_WINDOW = "3600"
# API_SECRET_KEY is now stored in Cloudflare Secrets Store
```

Set your API key in Cloudflare Secrets Store:

```bash
wrangler secret-store put ai-worker-api-key
# Enter your API key when prompted
```

### 3. Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### 4. Deployment

```bash
# Deploy to production
npm run deploy

# Or use GitHub Actions (recommended)
# Push to main branch to trigger automatic deployment
```

## 🧪 Test Your Deployed API

Once deployed, test your API with these working curl commands:

### Health Check (No Authentication)
```bash
curl https://ai.emilycogsdill.com/api/health
```
**Response**: Service status and available models

### List Available Models  
```bash
curl -H "Authorization: Bearer your-api-key" \
  https://ai.emilycogsdill.com/api/models
```
**Response**: List of all available AI models

### Test Authentication
```bash
# Valid request (replace with your actual API key)
curl -H "Authorization: Bearer your-api-key" \
  https://ai.emilycogsdill.com/api/models

# Invalid request (should return 401)
curl -H "Authorization: Bearer invalid-key" \
  https://ai.emilycogsdill.com/api/models
```

### Chat Completion
```bash
curl -X POST https://ai.emilycogsdill.com/api/chat \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "model": "@cf/openai/gpt-oss-120b",
    "reasoning_effort": "medium",
    "max_tokens": 50
  }'
```

Replace `your-api-key` with your actual API key from Cloudflare Secrets Store.

## API Endpoints

### Authentication

All endpoints except `/api/health` require a Bearer token:

```bash
Authorization: Bearer your-api-key-here
```

### Health Check

```bash
GET /api/health
```

Returns service health and available models.

### List Models

```bash
GET /api/models
Authorization: Bearer your-api-key
```

### Chat Completion (OpenAI-compatible)

```bash
POST /api/chat
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "model": "@cf/openai/gpt-oss-120b",
  "reasoning_effort": "medium",
  "max_tokens": 1024,
  "temperature": 0.7
}
```

### Simple Chat (Generic with System Prompts)

```bash
POST /api/v1/chat
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "message": "Your question here",
  "systemPrompt": "Optional: Define the AI's personality and behavior"
}
```

This endpoint allows you to create custom AI assistants with different personalities. See the [integration guide](.project/integration.md) for examples.

### Text Completion

```bash
POST /api/complete
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "prompt": "The weather today is",
  "max_tokens": 100,
  "temperature": 0.7
}
```

### Text Embeddings

```bash
POST /api/embed
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "input": "This is a test sentence.",
  "model": "@cf/baai/bge-base-en-v1.5"
}
```

### Survey Question Normalization

```bash
POST /api/normalize-survey-question
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "question": "On a scale of 1-10, how satisfied are you?",
  "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
}
```

## Example Usage

### JavaScript/TypeScript

```javascript
const API_BASE = 'https://ai.emilycogsdill.com';
const API_KEY = 'your-api-key';

async function chatCompletion(messages, reasoningEffort = 'medium') {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: '@cf/openai/gpt-oss-120b',
      reasoning_effort: reasoningEffort,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  
  return await response.json();
}

// Usage
const result = await chatCompletion([
  { role: 'user', content: 'Hello!' }
]);
console.log(result.choices[0].message.content);
```

### Python

```python
import requests

API_BASE = 'https://ai.emilycogsdill.com'
API_KEY = 'your-api-key'

def chat_completion(messages, reasoning_effort='medium'):
    response = requests.post(
        f'{API_BASE}/api/chat',
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'messages': messages,
            'model': '@cf/openai/gpt-oss-120b',
            'reasoning_effort': reasoning_effort,
            'max_tokens': 1024,
            'temperature': 0.7,
        }
    )
    return response.json()

# Usage
result = chat_completion([
    {'role': 'user', 'content': 'Hello!'}
])
print(result['choices'][0]['message']['content'])
```

### cURL

```bash
curl -X POST https://ai.emilycogsdill.com/api/chat \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "model": "@cf/openai/gpt-oss-120b",
    "reasoning_effort": "medium",
    "max_tokens": 1024,
    "temperature": 0.7
  }'
```

## Available Models

### GPT-OSS Chat & Completion Models
- `@cf/openai/gpt-oss-120b` (default) - Production model with 117B total parameters, 5.1B active per token, best for complex reasoning
- `@cf/openai/gpt-oss-20b` - Edge model with 21B total parameters, 3.6B active per token, best for lower latency

Both GPT-OSS models support:
- **128k context window** for long conversations
- **Reasoning effort levels**: "low", "medium" (default), "high"
- **Advanced reasoning capabilities** through mixture of experts architecture

### Embedding Models
- `@cf/baai/bge-base-en-v1.5` (default)

## Rate Limits

- **Default**: 100 requests per hour per API key
- **Headers**: Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `RATE_LIMIT_REQUESTS` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW` | Rate limit window in seconds | `3600` |
| `ENVIRONMENT` | Environment name | `production` |

### Secrets Store

| Secret | Description | Required |
|--------|-------------|----------|
| `ai-worker-api-key` | API authentication key | Yes |

Set secrets using:
```bash
wrangler secret-store put ai-worker-api-key
```

## GitHub Actions Setup

Add these secrets to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID  
- `API_SECRET_KEY`: Your API secret key for production
- `API_SECRET_KEY_STAGING`: Your API secret key for staging

## Development

### Project Structure

```
ai-worker-api/
├── src/
│   ├── index.ts              # Main worker entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── handlers/             # Request handlers
│   │   ├── chat.ts
│   │   ├── completion.ts
│   │   ├── embedding.ts
│   │   ├── models.ts
│   │   └── health.ts
│   ├── middleware/           # Middleware functions
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   └── rateLimit.ts
│   └── utils/               # Utility functions
│       ├── cache.ts
│       └── logger.ts
├── tests/                   # Test files
├── scripts/                 # Utility scripts
└── .github/workflows/       # GitHub Actions
```

### Adding New Endpoints

1. Create a new handler in `src/handlers/`
2. Add types to `src/types.ts`
3. Register the route in `src/index.ts`
4. Add tests in `tests/`
5. Update documentation

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test tests/api.test.ts
```

## Security

- API keys are validated for all protected endpoints
- Request/response logging excludes sensitive information
- CORS is configurable with origin restrictions
- Rate limiting prevents abuse
- Input validation on all endpoints

## Error Handling

The API returns standard HTTP status codes with JSON error responses:

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "code": "error_code"
  }
}
```

Common error types:
- `authentication_error`: Invalid or missing API key
- `rate_limit_exceeded`: Too many requests
- `invalid_request_error`: Invalid request parameters
- `server_error`: Internal server error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/emily-flambe/ai-worker-api/issues)
- Documentation: This README
- Examples: See `/examples` directory (coming soon)

## Changelog

### v1.0.0
- Initial release
- Chat completion endpoint
- Text completion endpoint  
- Embedding endpoint
- Model listing endpoint
- Authentication middleware
- Rate limiting
- CORS support
- Comprehensive testing
- GitHub Actions CI/CD