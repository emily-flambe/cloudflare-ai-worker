import { describe, it, expect } from 'vitest';
import { Env } from '../src/types';
import worker from '../src/index';

const mockEnv: Env = {
  AI: {
    run: async (model: string, options: any) => {
      // Mock AI responses based on the user message
      const userMessage = options.messages?.[1]?.content || '';
      
      if (userMessage.toLowerCase().includes('cutty')) {
        return {
          response: 'Cutty is an amazing app that helps users manage their daily tasks efficiently. It features a clean interface and powerful organization tools.',
        };
      }
      
      return {
        response: 'I can help you with various tasks. Feel free to ask me anything!',
      };
    },
  } as any,
  RATE_LIMIT: {
    get: async (key: string) => null,
    put: async (key: string, value: string, options?: any) => {},
    delete: async (key: string) => {},
    list: async (options?: any) => ({ keys: [] }),
  } as any,
  SECRETS_STORE: {
    get: async (key: string) => {
      if (key === 'ai-worker-api-key') {
        return 'test-secret-key';
      }
      return null;
    },
  } as any,
  API_SECRET_KEY: 'test-secret-key', // Fallback for backward compatibility
  ALLOWED_ORIGINS: '*',
  RATE_LIMIT_REQUESTS: '100',
  RATE_LIMIT_WINDOW: '3600',
  ENVIRONMENT: 'test',
};

// Helper function to create a mock request
function createMockRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Request {
  const url = `http://localhost:8787${path}`;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-secret-key',
  };
  
  // Merge headers properly, allowing override of default headers
  const finalHeaders = headers ? { ...defaultHeaders, ...headers } : defaultHeaders;

  return new Request(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Simple Chatbot API', () => {
  it('should respond to simple chat messages', async () => {
    const request = createMockRequest('POST', '/api/v1/chat', {
      message: 'Hello, what can you help me with?'
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(200);
    
    const data = await response.json() as any;
    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  it('should handle questions about the Cutty app', async () => {
    const request = createMockRequest('POST', '/api/v1/chat', {
      message: 'What is the Cutty app?'
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(200);
    
    const data = await response.json() as any;
    expect(data).toHaveProperty('response');
    expect(data.response.toLowerCase()).toContain('cutty');
  });

  it('should return error for missing message', async () => {
    const request = createMockRequest('POST', '/api/v1/chat', {});

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(400);
    
    const data = await response.json() as any;
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Message is required');
  });

  it('should return error for invalid message type', async () => {
    const request = createMockRequest('POST', '/api/v1/chat', {
      message: 123
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(400);
    
    const data = await response.json() as any;
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Message is required and must be a string');
  });

  it('should return error for message that is too long', async () => {
    const longMessage = 'a'.repeat(5000);
    
    const request = createMockRequest('POST', '/api/v1/chat', {
      message: longMessage
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(400);
    
    const data = await response.json() as any;
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Message is too long');
  });

  it('should require authentication', async () => {
    // Create request without Authorization header
    const request = new Request('http://localhost:8787/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(401);
    
    const data = await response.json() as any;
    expect(data).toHaveProperty('error');
    expect(data.error.message).toContain('Authorization');
  });
});