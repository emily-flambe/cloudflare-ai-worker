import { describe, it, expect, beforeEach } from 'vitest';
import { Env } from '../src/types';
import worker from '../src/index';

const mockEnv: Env = {
  AI: {
    run: async (model: string, options: any) => {
      if (model.includes('embedding')) {
        return {
          data: Array(384).fill(0).map(() => Math.random() - 0.5),
        };
      }
      
      // Handle survey normalization requests
      if (options.messages && options.messages.length > 0) {
        const systemMessage = options.messages[0];
        const userMessage = options.messages[1];
        
        if (systemMessage?.content?.includes('survey question normalization')) {
          return {
            response: JSON.stringify({
              normalized_question: "What is your preferred pet type?",
              confidence_score: 0.95,
              category: "pet_preferences",
              suggestions: [
                {
                  question: "What is your preferred pet type?",
                  confidence: 0.95,
                  reasoning: "Standardized format for pet preference questions, removes bias and ambiguity"
                }
              ]
            }),
            usage: {
              prompt_tokens: 150,
              completion_tokens: 50,
              total_tokens: 200,
            },
          };
        }
      }
      
      return {
        response: 'This is a test response from the AI model.',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
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

  describe('Survey Normalization Endpoint', () => {
    it('should require authentication', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        body: JSON.stringify({
          question: 'Do you like dogs or cats better?',
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(401);
      expect(data.error.type).toBe('authentication_error');
    });

    it('should validate request body - missing question', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.message).toBe('question field is required');
    });

    it('should validate request body - empty question', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: '',
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.message).toBe('question cannot be empty');
    });

    it('should validate request body - question too long', async () => {
      const longQuestion = 'a'.repeat(1001);
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: longQuestion,
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.message).toBe('question is too long (max 1000 characters)');
    });

    it('should validate request body - invalid question type', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 123,
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.message).toBe('question must be a string');
    });

    it('should handle valid survey normalization request', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Do you like dogs or cats better?',
          category: 'pet_preferences',
          context: 'Market research survey',
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.object).toBe('survey_normalization');
      expect(data.id).toBeDefined();
      expect(data.id.startsWith('norm-')).toBe(true);
      expect(data.created).toBeDefined();
      expect(data.original_question).toBe('Do you like dogs or cats better?');
      expect(data.normalized_question).toBe('What is your preferred pet type?');
      expect(data.confidence_score).toBe(0.95);
      expect(data.category).toBe('pet_preferences');
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions.length).toBeGreaterThan(0);
      expect(data.suggestions[0].question).toBeDefined();
      expect(data.suggestions[0].confidence).toBeDefined();
      expect(data.suggestions[0].reasoning).toBeDefined();
      expect(data.usage).toBeDefined();
      expect(data.usage.prompt_tokens).toBeGreaterThan(0);
      expect(data.usage.completion_tokens).toBeGreaterThan(0);
      expect(data.usage.total_tokens).toBeGreaterThan(0);
    });

    it('should handle survey normalization request without optional fields', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'What do you think about this product?',
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.object).toBe('survey_normalization');
      expect(data.original_question).toBe('What do you think about this product?');
      expect(data.normalized_question).toBeDefined();
      expect(data.confidence_score).toBeDefined();
    });

    it('should validate category and context fields when provided', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Do you like this?',
          category: 123,
        }),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.message).toBe('category must be a string');
    });

    it('should add rate limit headers to survey normalization responses', async () => {
      const request = new Request('http://localhost/api/normalize-survey-question', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Do you like dogs or cats better?',
        }),
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
      expect(data.endpoints).toContain('POST /api/normalize-survey-question - Survey question normalization');
    });
  });
});