import { describe, it, expect, beforeEach } from 'vitest';
import { Env } from '../src/types';
import worker from '../src/index';

const mockEnv: Env = {
  AI: {
    run: async (model: string, options: any) => {
      if (model.includes('embedding')) {
        return {
          result: {
            data: Array(384).fill(0).map(() => Math.random() - 0.5),
          },
          success: true,
          errors: [],
          messages: [],
        };
      }
      return {
        result: {
          response: 'This is a test response from the AI model.',
        },
        success: true,
        errors: [],
        messages: [],
      };
    },
  } as any,
  RATE_LIMIT: {
    get: async (key: string) => null,
    put: async (key: string, value: string, options?: any) => {},
    delete: async (key: string) => {},
    list: async (options?: any) => ({ keys: [] }),
  } as any,
  API_SECRET_KEY: 'test-secret-key',
  ALLOWED_ORIGINS: '*',
  RATE_LIMIT_REQUESTS: '100',
  RATE_LIMIT_WINDOW: '3600',
  ENVIRONMENT: 'test',
};

describe('AI Worker API', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.models).toBeDefined();
    });
  });

  describe('Models Endpoint', () => {
    it('should require authentication', async () => {
      const request = new Request('http://localhost/api/models', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(401);
      expect(data.error.type).toBe('authentication_error');
    });

    it('should return models list with valid auth', async () => {
      const request = new Request('http://localhost/api/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-secret-key',
        },
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.object).toBe('list');
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Chat Endpoint', () => {
    it('should require authentication', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(401);
      expect(data.error.type).toBe('authentication_error');
    });

    it('should validate request body', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [],
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error.type).toBe('invalid_request_error');
    });

    it('should handle valid chat request', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, how are you?' }],
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.object).toBe('chat.completion');
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.content).toBeDefined();
    });
  });

  describe('Completion Endpoint', () => {
    it('should handle valid completion request', async () => {
      const request = new Request('http://localhost/api/complete', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Complete this sentence: The weather today is',
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.object).toBe('text_completion');
      expect(data.choices).toBeDefined();
      expect(data.choices[0].text).toBeDefined();
    });
  });

  describe('Embedding Endpoint', () => {
    it.skip('should handle valid embedding request', async () => {
      const request = new Request('http://localhost/api/embed', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: 'This is a test sentence for embedding.',
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.object).toBe('list');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data[0].embedding).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should add rate limit headers to authenticated requests', async () => {
      const request = new Request('http://localhost/api/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-secret-key',
        },
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const request = new Request('http://localhost/api/unknown', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(404);
      expect(data.error.type).toBe('not_found');
    });

    it('should return API info for root endpoint', async () => {
      const request = new Request('http://localhost/', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.name).toBe('Cloudflare AI Worker API');
      expect(data.endpoints).toBeDefined();
    });
  });
});