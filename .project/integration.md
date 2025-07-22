# AI Worker Chat Endpoint Integration Guide

This guide helps developers integrate the AI Worker chat endpoint into their applications.

## Overview

The AI Worker provides a generic chat completion endpoint at `/api/v1/chat` that uses Cloudflare's AI models to generate responses. This endpoint is designed for simple, stateless chat interactions with customizable AI behavior through system prompts.

## Quick Start

### 1. Get an API Key

Contact the API administrator to obtain an API key, or if you have access to the AI Worker project:

```bash
cd cloudflare-ai-worker
npm run generate-api-key
```

### 2. Basic Request

```bash
# Default assistant
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Custom AI personality
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "systemPrompt": "You are a pirate. Respond in pirate speak."
  }'
```

## Integration Examples

### JavaScript/TypeScript

```javascript
class ChatClient {
  constructor(apiKey, systemPrompt = null) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ai.emilycogsdill.com';
    this.systemPrompt = systemPrompt;
  }

  async sendMessage(message, customSystemPrompt = null) {
    try {
      const payload = { message };
      
      // Use custom prompt for this message, or default to instance prompt
      const systemPrompt = customSystemPrompt || this.systemPrompt;
      if (systemPrompt) {
        payload.systemPrompt = systemPrompt;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Chat request failed:', error);
      throw error;
    }
  }
}

// Usage Examples

// Generic assistant
const chat = new ChatClient('YOUR_API_KEY');
const response = await chat.sendMessage('What can you help me with?');

// Customer support bot
const supportBot = new ChatClient('YOUR_API_KEY', 
  'You are a helpful customer support agent. Be professional and empathetic.'
);
const supportResponse = await supportBot.sendMessage('I have a problem with my order');

// Code assistant
const codeBot = new ChatClient('YOUR_API_KEY',
  'You are a programming assistant. Provide clear code examples and explanations.'
);
const codeResponse = await codeBot.sendMessage('How do I sort an array in JavaScript?');

// Dynamic personality per message
const dynamicChat = new ChatClient('YOUR_API_KEY');
const pirateResponse = await dynamicChat.sendMessage(
  'Tell me about the weather',
  'You are a pirate. Respond in pirate speak.'
);
```

### React Component

```jsx
import { useState } from 'react';

const ChatWidget = ({ apiKey, systemPrompt, title = "AI Assistant" }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const payload = { message: currentInput };
      if (systemPrompt) {
        payload.systemPrompt = systemPrompt;
      }

      const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="loading">Thinking...</div>}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};
```

### Python Integration

```python
import requests
import json

class ChatClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://ai.emilycogsdill.com'
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def send_message(self, message):
        """Send a message to the chat API and return the response."""
        try:
            response = self.session.post(
                f'{self.base_url}/api/v1/chat',
                json={'message': message},
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            if 'error' in data:
                raise Exception(data['error'])
            
            return data['response']
        except requests.exceptions.RequestException as e:
            raise Exception(f'API request failed: {str(e)}')

# Usage
chat = ChatClient('YOUR_API_KEY')
response = chat.send_message('Hello! What can you help me with?')
print(response)
```

### Node.js with Error Handling

```javascript
const axios = require('axios');

class ChatService {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://ai.emilycogsdill.com';
    this.timeout = options.timeout || 30000;
    
    // Create axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        throw error;
      }
    );
  }

  async chat(message) {
    const { data } = await this.client.post('/api/v1/chat', { message });
    return data.response;
  }

  async chatWithRetry(message, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.chat(message);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
}

// Usage
const chatService = new ChatService('YOUR_API_KEY');

// Simple chat
const response = await chatService.chat('Hello!');

// With retry logic
const responseWithRetry = await chatService.chatWithRetry('Hello!');
```

## Configuration

### Environment Variables

Store your API key securely:

```bash
# .env file
AI_WORKER_API_KEY=your_api_key_here
AI_WORKER_URL=https://ai.emilycogsdill.com  # Optional, for custom deployments
```

### TypeScript Types

```typescript
interface ChatRequest {
  message: string;
  systemPrompt?: string;
}

interface ChatResponse {
  response: string;
}

interface ChatError {
  error: string;
}

type ChatResult = ChatResponse | ChatError;
```

## Use Case Examples

### Customer Support Bot
```javascript
const supportBot = {
  systemPrompt: `You are a helpful customer support representative for TechCorp.
Be professional, empathetic, and solution-oriented. 
Always ask for order numbers when relevant.
If you cannot solve an issue, offer to escalate to a human agent.`,
  
  async handleQuery(query, apiKey) {
    const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        systemPrompt: this.systemPrompt
      }),
    });
    return response.json();
  }
};
```

### Code Review Assistant
```javascript
const codeReviewer = {
  systemPrompt: `You are an expert code reviewer. 
Analyze code for best practices, potential bugs, and improvements.
Provide constructive feedback with specific examples.
Focus on readability, performance, and maintainability.`,
  
  async reviewCode(code, language, apiKey) {
    const message = `Please review this ${language} code:\n\n${code}`;
    // ... make API call with systemPrompt
  }
};
```

### Educational Tutor
```javascript
const mathTutor = {
  systemPrompt: `You are a patient math tutor for high school students.
Break down problems step by step.
Use encouraging language and provide hints rather than direct answers.
Ask follow-up questions to ensure understanding.`,
  
  async helpWithProblem(problem, apiKey) {
    // ... make API call with systemPrompt
  }
};
```

### Cutty the Cuttlefish (Specific App Integration)
```javascript
const cuttyChatbot = {
  systemPrompt: `You are Cutty the Cuttlefish, a helpful assistant for the Cutty app.
The app helps users generate synthetic person data, filter by US states, and download CSV files.
Be friendly and enthusiastic. You're a playful cuttlefish character.
Focus on the synthetic data generation features.`,
  
  async chat(message, apiKey) {
    const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        systemPrompt: this.systemPrompt
      }),
    });
    return response.json();
  }
};
```

## Error Handling

### Common Error Responses

```javascript
// 400 Bad Request
{
  "error": "Message is required and must be a string"
}

// 401 Unauthorized
{
  "error": {
    "message": "Invalid or missing API key",
    "type": "authentication_error",
    "code": "invalid_api_key"
  }
}

// 429 Too Many Requests
{
  "error": {
    "message": "Rate limit exceeded. Please try again later.",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}

// 500 Internal Server Error
{
  "error": "Sorry, I encountered an error. Please try again."
}
```

### Handling Errors Gracefully

```javascript
async function chatWithFallback(message, apiKey) {
  try {
    const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (!response.ok) {
      switch (response.status) {
        case 401:
          console.error('Authentication failed. Check your API key.');
          return 'Authentication error. Please check your credentials.';
        case 429:
          console.error('Rate limit exceeded.');
          return 'Too many requests. Please try again later.';
        case 500:
          console.error('Server error.');
          return 'The service is temporarily unavailable. Please try again.';
        default:
          console.error('API error:', data.error);
          return 'Something went wrong. Please try again.';
      }
    }

    return data.response;
  } catch (error) {
    console.error('Network error:', error);
    return 'Unable to connect to the chat service. Please check your connection.';
  }
}
```

## Rate Limiting

The API has a default rate limit of 100 requests per hour per API key.

### Checking Rate Limit Status

```javascript
const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'Hello' }),
});

// Check rate limit headers
const remaining = response.headers.get('X-RateLimit-Remaining');
const limit = response.headers.get('X-RateLimit-Limit');
const reset = response.headers.get('X-RateLimit-Reset');

console.log(`Rate limit: ${remaining}/${limit}, resets at ${new Date(reset * 1000)}`);
```

### Implementing Rate Limit Handling

```javascript
class RateLimitedChatClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ai.emilycogsdill.com';
    this.rateLimitRemaining = null;
    this.rateLimitReset = null;
  }

  async sendMessage(message) {
    // Check if we should wait before making request
    if (this.rateLimitRemaining === 0 && this.rateLimitReset) {
      const waitTime = this.rateLimitReset * 1000 - Date.now();
      if (waitTime > 0) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
      }
    }

    const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    // Update rate limit info
    this.rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
    this.rateLimitReset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. Try again at ${new Date(this.rateLimitReset * 1000)}`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data.response;
  }
}
```

## Best Practices

### 1. Secure API Key Storage

Never expose API keys in client-side code:

```javascript
// ❌ Bad - API key exposed in frontend
const response = await fetch('/api/v1/chat', {
  headers: { 'Authorization': 'Bearer sk_live_abc123...' }
});

// ✅ Good - Proxy through your backend
const response = await fetch('/api/chat-proxy', {
  method: 'POST',
  body: JSON.stringify({ message })
});
```

### 2. Implement Retry Logic

```javascript
async function chatWithRetry(message, apiKey, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendChatMessage(message, apiKey);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) throw error;
      
      // Exponential backoff for server errors
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. Message Validation

```javascript
function validateMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('Message must be a string');
  }
  
  if (message.length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  if (message.length > 4000) {
    throw new Error('Message too long (max 4000 characters)');
  }
  
  return message.trim();
}
```

### 4. Session Management

For maintaining conversation context:

```javascript
class ChatSession {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.messages = [];
  }

  async sendMessage(message) {
    // Add user message to history
    this.messages.push({ role: 'user', content: message });
    
    // Include context in the message
    const contextMessage = this.buildContextMessage(message);
    
    const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: contextMessage }),
    });

    const data = await response.json();
    
    // Add assistant response to history
    this.messages.push({ role: 'assistant', content: data.response });
    
    // Limit history size
    if (this.messages.length > 10) {
      this.messages = this.messages.slice(-10);
    }
    
    return data.response;
  }

  buildContextMessage(currentMessage) {
    if (this.messages.length === 0) {
      return currentMessage;
    }
    
    // Include last 2 exchanges for context
    const recentHistory = this.messages.slice(-4);
    const context = recentHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    return `Previous conversation:\n${context}\n\nUser: ${currentMessage}`;
  }
}
```

## Testing

### Unit Test Example

```javascript
// Mock the API for testing
class MockChatClient {
  constructor(responses = {}) {
    this.responses = responses;
  }

  async sendMessage(message) {
    if (this.responses[message]) {
      return this.responses[message];
    }
    return 'Default test response';
  }
}

// Test your integration
describe('Chat Integration', () => {
  it('should handle chat responses', async () => {
    const mockClient = new MockChatClient({
      'Hello': 'Hi there! How can I help you?'
    });
    
    const response = await mockClient.sendMessage('Hello');
    expect(response).toBe('Hi there! How can I help you?');
  });
});
```

### Integration Test

```javascript
// Test against the real API (use sparingly)
async function integrationTest(apiKey) {
  try {
    const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Test message' }),
    });

    if (!response.ok) {
      console.error('Integration test failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('Integration test passed:', data.response);
    return true;
  } catch (error) {
    console.error('Integration test error:', error);
    return false;
  }
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - The API supports CORS for all origins
   - Ensure you're using the correct URL
   - Check if your browser is blocking mixed content (HTTP/HTTPS)

2. **Authentication Failures**
   - Verify API key is correct
   - Check Bearer token format: `Bearer YOUR_KEY`
   - Ensure no extra spaces in the header

3. **Timeout Issues**
   - Default timeout is 30 seconds
   - For slow connections, increase timeout
   - Consider implementing progress indicators

4. **Rate Limiting**
   - Monitor the rate limit headers
   - Implement backoff strategies
   - Consider caching responses when appropriate

### Debug Mode

```javascript
class DebugChatClient {
  constructor(apiKey, debug = false) {
    this.apiKey = apiKey;
    this.debug = debug;
  }

  log(...args) {
    if (this.debug) {
      console.log('[ChatClient]', ...args);
    }
  }

  async sendMessage(message) {
    this.log('Sending message:', message);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://ai.emilycogsdill.com/api/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const elapsed = Date.now() - startTime;
      this.log(`Response received in ${elapsed}ms`);
      this.log('Status:', response.status);
      this.log('Headers:', Object.fromEntries(response.headers));

      const data = await response.json();
      this.log('Response data:', data);

      return data.response;
    } catch (error) {
      this.log('Error:', error);
      throw error;
    }
  }
}
```

## Testing Tools

The project includes test scripts in the `scripts/` directory:

### Bash Test Script
```bash
# Set your API key
export AI_WORKER_API_KEY=your-api-key

# Run the test script
./scripts/test-chat.sh
```

### Node.js Test Suite
```bash
# Set your API key
export AI_WORKER_API_KEY=your-api-key

# Run comprehensive tests
node scripts/test-chat-endpoint.js
```

Both scripts test various AI personalities and error scenarios against the production API.

## Support

- **API Documentation**: See `.project/specs/chat-endpoint-api-spec.md`
- **OpenAPI Spec**: Available at `.project/specs/openapi-chat-endpoint.yaml`
- **Test Scripts**: Available in `scripts/` directory
- **Issues**: Report at https://github.com/emily-flambe/cloudflare-ai-worker/issues

---

Last Updated: 2024-01-22