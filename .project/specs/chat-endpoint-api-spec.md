# Chat Endpoint API Specification

## Endpoint Overview

The `/api/v1/chat` endpoint provides access to a generic AI-powered chat interface using Cloudflare's GPT-OSS models. It can be customized with system prompts and reasoning effort levels to create various types of assistants and chatbots.

### Base URL
- **Production**: `https://ai.emilycogsdill.com`
- **Development**: `http://localhost:8787`

### Endpoint
```
POST /api/v1/chat
```

## Authentication

This endpoint requires Bearer token authentication.

### Headers
```
Authorization: Bearer <api_key>
Content-Type: application/json
```

### Obtaining an API Key
Contact the API administrator or use the provided key generation script.

## Request

### HTTP Method
`POST`

### Request Headers
| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token for API authentication. Format: `Bearer YOUR_API_KEY` |
| `Content-Type` | Yes | Must be `application/json` |

### Request Body

#### Schema
```json
{
  "message": "string",
  "systemPrompt": "string (optional)",
  "model": "string (optional)",
  "reasoning_effort": "string (optional)"
}
```

#### Fields
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `message` | string | Yes | The user's message to the chatbot | Max length: 4000 characters |
| `systemPrompt` | string | No | Custom system prompt to define AI behavior | Defaults to generic assistant |
| `model` | string | No | GPT-OSS model to use | `@cf/openai/gpt-oss-120b` (default) or `@cf/openai/gpt-oss-20b` |
| `reasoning_effort` | string | No | Level of reasoning to apply | `low`, `medium` (default), `high` |

#### Example Requests

**Default Assistant (GPT-OSS 120B with medium reasoning):**
```json
{
  "message": "How do I sort an array in JavaScript?"
}
```

**Custom Personality with High Reasoning:**
```json
{
  "message": "Tell me about the weather",
  "systemPrompt": "You are a meteorologist. Provide detailed, scientific weather explanations.",
  "reasoning_effort": "high"
}
```

**Fast Response with Edge Model:**
```json
{
  "message": "What is the capital of France?",
  "model": "@cf/openai/gpt-oss-20b",
  "reasoning_effort": "low"
}
```

**Complex Problem Solving:**
```json
{
  "message": "Explain how to implement a balanced binary search tree",
  "model": "@cf/openai/gpt-oss-120b",
  "reasoning_effort": "high"
}
```

**Specific Application Bot:**
```json
{
  "message": "How do I generate synthetic data?",
  "systemPrompt": "You are Cutty the Cuttlefish, assistant for the Cutty app that generates synthetic person data.",
  "model": "@cf/openai/gpt-oss-120b",
  "reasoning_effort": "medium"
}
```

## Response

### Success Response

#### Status Code
`200 OK`

#### Response Headers
```
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1703001234
```

#### Response Body Schema
```json
{
  "response": "string"
}
```

#### Fields
| Field | Type | Description |
|-------|------|-------------|
| `response` | string | The chatbot's response message |

#### Example Success Response
```json
{
  "response": "I'd be happy to help you generate synthetic data! The Cutty app makes it easy to create realistic but fake personal information for testing. You can specify how many records you want, filter by US states, and download the results as a CSV file. Just navigate to the synthetic data generator section after logging in!"
}
```

### Error Responses

#### 400 Bad Request
Returned when the request is invalid.

```json
{
  "error": "Message is required and must be a string"
}
```

Common causes:
- Missing `message` field
- `message` is not a string
- `message` exceeds 4000 characters
- Invalid `model` parameter (not a supported GPT-OSS model)
- Invalid `reasoning_effort` parameter (not low/medium/high)

#### 401 Unauthorized
Returned when authentication fails.

```json
{
  "error": {
    "message": "Invalid or missing API key",
    "type": "authentication_error",
    "code": "invalid_api_key"
  }
}
```

#### 429 Too Many Requests
Returned when rate limit is exceeded.

```json
{
  "error": {
    "message": "Rate limit exceeded. Please try again later.",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

#### 500 Internal Server Error
Returned when the server encounters an error.

```json
{
  "error": "Sorry, I encountered an error. Please try again."
}
```

## Rate Limiting

- **Default Limit**: 100 requests per hour per API key
- **Window**: Rolling 1-hour window
- **Headers**: Rate limit information included in all responses
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## CORS

CORS is enabled for all origins by default. The following headers are included:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## GPT-OSS Models

### Available Models

#### Production Model: `@cf/openai/gpt-oss-120b` (Default)
- **Total Parameters**: 117B
- **Active Parameters per Token**: 5.1B
- **Context Window**: 128k tokens
- **Best For**: Complex reasoning, code generation, creative tasks, detailed analysis
- **Typical Response Time**: 2-5 seconds

#### Edge Model: `@cf/openai/gpt-oss-20b`
- **Total Parameters**: 21B  
- **Active Parameters per Token**: 3.6B
- **Context Window**: 128k tokens
- **Best For**: Fast responses, simple queries, high-throughput applications
- **Typical Response Time**: 1-3 seconds

### Reasoning Effort Levels

Both models support adjustable reasoning effort through the mixture of experts architecture:

#### `low` - Fastest Processing
- Optimized for speed
- Suitable for: Simple questions, basic conversations, quick factual lookups
- Use cases: Chatbots, simple Q&A, real-time interactions

#### `medium` - Balanced Performance (Default)
- Good balance of quality and speed
- Suitable for: General conversations, moderate complexity tasks, content generation
- Use cases: Customer support, educational content, general assistance

#### `high` - Maximum Reasoning
- Most thorough analysis and reasoning
- Suitable for: Complex problems, detailed explanations, technical analysis
- Use cases: Research tasks, complex coding problems, in-depth analysis

### Model Selection Guidelines

| Use Case | Recommended Model | Reasoning Effort |
|----------|------------------|------------------|
| Quick facts/definitions | `gpt-oss-20b` | `low` |
| General conversation | `gpt-oss-120b` | `medium` |
| Code debugging | `gpt-oss-120b` | `high` |
| Creative writing | `gpt-oss-120b` | `medium` |
| Mathematical proofs | `gpt-oss-120b` | `high` |
| Simple calculations | `gpt-oss-20b` | `low` |
| Research analysis | `gpt-oss-120b` | `high` |
| Mobile app chatbot | `gpt-oss-20b` | `medium` |

## System Prompt Customization

The `systemPrompt` parameter allows you to create specialized AI assistants for different use cases:

### Examples:
- **Customer Support**: Professional, empathetic responses with escalation options
- **Code Assistant**: Technical explanations with code examples
- **Educational Tutor**: Step-by-step explanations with encouraging language
- **Creative Writer**: Imaginative and descriptive responses
- **Medical Information**: Careful, disclaimer-heavy health information
- **Game Character**: In-character responses for gaming applications

### Best Practices:
1. Be specific about the assistant's role and knowledge domain
2. Define the tone and communication style
3. Include any specific rules or constraints
4. Mention what the assistant should and shouldn't do
5. Keep prompts concise but comprehensive

## Code Examples

### cURL

**Basic Request (Default GPT-OSS 120B):**
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "What features does the Cutty app have?"}'
```

**Fast Response with Edge Model:**
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is 2+2?",
    "model": "@cf/openai/gpt-oss-20b",
    "reasoning_effort": "low"
  }'
```

**Complex Problem with High Reasoning:**
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain quantum entanglement and its applications",
    "model": "@cf/openai/gpt-oss-120b",
    "reasoning_effort": "high"
  }'
```

### JavaScript (Fetch API)

**Basic Request:**
```javascript
const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What features does the Cutty app have?',
    model: '@cf/openai/gpt-oss-120b',
    reasoning_effort: 'medium'
  })
});

const data = await response.json();

if (response.ok) {
  console.log(data.response);
} else {
  console.error(data.error);
}
```

**Adaptive Model Selection:**
```javascript
class GPTOSSChatClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ai.emilycogsdill.com/api/v1/chat';
  }

  async sendMessage(message, options = {}) {
    const {
      model = '@cf/openai/gpt-oss-120b',
      reasoningEffort = 'medium',
      systemPrompt
    } = options;

    const payload = {
      message,
      model,
      reasoning_effort: reasoningEffort
    };

    if (systemPrompt) {
      payload.systemPrompt = systemPrompt;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return response.json();
  }

  // Quick responses for simple queries
  async quickChat(message) {
    return this.sendMessage(message, {
      model: '@cf/openai/gpt-oss-20b',
      reasoningEffort: 'low'
    });
  }

  // Deep reasoning for complex problems
  async deepReasoning(message, systemPrompt) {
    return this.sendMessage(message, {
      model: '@cf/openai/gpt-oss-120b',
      reasoningEffort: 'high',
      systemPrompt
    });
  }
}

// Usage
const client = new GPTOSSChatClient('YOUR_API_KEY');

// Quick response
const quick = await client.quickChat('What is the capital of Spain?');

// Deep reasoning
const deep = await client.deepReasoning(
  'Design a distributed system architecture',
  'You are a senior system architect with expertise in scalable systems.'
);
```

### Python (requests)

**Basic Usage:**
```python
import requests

class GPTOSSClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://ai.emilycogsdill.com/api/v1/chat'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def chat(self, message, model='@cf/openai/gpt-oss-120b', reasoning_effort='medium', system_prompt=None):
        data = {
            'message': message,
            'model': model,
            'reasoning_effort': reasoning_effort
        }
        
        if system_prompt:
            data['systemPrompt'] = system_prompt
        
        response = requests.post(self.base_url, json=data, headers=self.headers)
        result = response.json()
        
        if response.status_code == 200:
            return result['response']
        else:
            raise Exception(f"API Error: {result.get('error', 'Unknown error')}")
    
    def quick_chat(self, message):
        """Fast responses using edge model"""
        return self.chat(message, model='@cf/openai/gpt-oss-20b', reasoning_effort='low')
    
    def deep_reasoning(self, message, system_prompt=None):
        """Complex reasoning with production model"""
        return self.chat(message, reasoning_effort='high', system_prompt=system_prompt)

# Usage examples
client = GPTOSSClient('YOUR_API_KEY')

# Standard chat
response = client.chat('What features does the Cutty app have?')
print(response)

# Quick response for simple questions
quick = client.quick_chat('What is 2+2?')
print(quick)

# Deep reasoning for complex problems
complex_response = client.deep_reasoning(
    'Explain the implications of quantum computing on cryptography',
    'You are a cybersecurity expert with deep knowledge of quantum computing.'
)
print(complex_response)
```

### Node.js (Axios)
```javascript
const axios = require('axios');

class GPTOSSClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://ai.emilycogsdill.com/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async chat(message, options = {}) {
    const {
      model = '@cf/openai/gpt-oss-120b',
      reasoningEffort = 'medium',
      systemPrompt
    } = options;

    try {
      const payload = {
        message,
        model,
        reasoning_effort: reasoningEffort
      };

      if (systemPrompt) {
        payload.systemPrompt = systemPrompt;
      }

      const response = await this.client.post('/chat', payload);
      return response.data.response;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'API request failed');
      }
      throw error;
    }
  }

  // Quick responses for simple queries
  async quickChat(message) {
    return this.chat(message, {
      model: '@cf/openai/gpt-oss-20b',
      reasoningEffort: 'low'
    });
  }

  // Deep reasoning for complex problems  
  async deepReasoning(message, systemPrompt) {
    return this.chat(message, {
      model: '@cf/openai/gpt-oss-120b',
      reasoningEffort: 'high',
      systemPrompt
    });
  }

  // Adaptive model selection based on message complexity
  async smartChat(message, systemPrompt) {
    const isSimple = message.length < 50 && !/[?!].*[?!]/.test(message);
    const isComplex = message.includes('explain') || message.includes('analyze') || 
                     message.includes('implement') || message.length > 200;

    if (isSimple) {
      return this.quickChat(message);
    } else if (isComplex) {
      return this.deepReasoning(message, systemPrompt);
    } else {
      return this.chat(message, { systemPrompt });
    }
  }
}

// Usage examples
const client = new GPTOSSClient('YOUR_API_KEY');

// Standard chat
const answer = await client.chat('What features does the Cutty app have?');
console.log(answer);

// Quick response
const quick = await client.quickChat('What is the capital of France?');
console.log(quick);

// Deep reasoning
const complex = await client.deepReasoning(
  'Design a microservices architecture for an e-commerce platform',
  'You are a senior software architect specializing in scalable systems.'
);
console.log(complex);

// Smart adaptive selection
const smart = await client.smartChat(
  'Can you explain the differences between REST and GraphQL APIs and when to use each?'
);
console.log(smart);
```

## SDK Support

Currently, there is no official SDK. Use standard HTTP client libraries in your preferred language.

## Webhook Support

This endpoint does not support webhooks. All interactions are synchronous request/response.

## Versioning

This API uses URL versioning. The current version is `v1`. Future versions will use different URL paths (e.g., `/api/v2/chat`).

## Service Level

- **Availability**: Best effort (no SLA)
- **Response Time**: Typically < 2 seconds
- **Timeout**: Requests timeout after 30 seconds

## Terms of Use

- Do not use for malicious purposes
- Respect rate limits
- Do not attempt to extract or reverse-engineer the AI model
- Content generated by the chatbot is for informational purposes only

## Support

For API issues, contact: [API administrator contact]
For integration help, see: https://github.com/emily-flambe/cloudflare-ai-worker

---

**API Version**: 1.0.0  
**Last Updated**: 2024-01-22  
**Status**: Active