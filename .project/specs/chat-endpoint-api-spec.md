# Chat Endpoint API Specification

## Endpoint Overview

The `/api/v1/chat` endpoint provides access to a generic AI-powered chat interface that can be customized with system prompts to create various types of assistants and chatbots.

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
  "systemPrompt": "string (optional)"
}
```

#### Fields
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `message` | string | Yes | The user's message to the chatbot | Max length: 4000 characters |
| `systemPrompt` | string | No | Custom system prompt to define AI behavior | Defaults to generic assistant |

#### Example Requests

**Default Assistant:**
```json
{
  "message": "How do I sort an array in JavaScript?"
}
```

**Custom Personality:**
```json
{
  "message": "Tell me about the weather",
  "systemPrompt": "You are a meteorologist. Provide detailed, scientific weather explanations."
}
```

**Specific Application Bot:**
```json
{
  "message": "How do I generate synthetic data?",
  "systemPrompt": "You are Cutty the Cuttlefish, assistant for the Cutty app that generates synthetic person data."
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
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "What features does the Cutty app have?"}'
```

### JavaScript (Fetch API)
```javascript
const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What features does the Cutty app have?'
  })
});

const data = await response.json();

if (response.ok) {
  console.log(data.response);
} else {
  console.error(data.error);
}
```

### Python (requests)
```python
import requests

url = 'https://ai.emilycogsdill.com/api/v1/chat'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
data = {
    'message': 'What features does the Cutty app have?'
}

response = requests.post(url, json=data, headers=headers)
result = response.json()

if response.status_code == 200:
    print(result['response'])
else:
    print(f"Error: {result.get('error', 'Unknown error')}")
```

### Node.js (Axios)
```javascript
const axios = require('axios');

const askCutty = async (message) => {
  try {
    const response = await axios.post(
      'https://ai.emilycogsdill.com/api/v1/chat',
      { message },
      {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.response;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'API request failed');
    }
    throw error;
  }
};

// Usage
const answer = await askCutty('What features does the Cutty app have?');
console.log(answer);
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