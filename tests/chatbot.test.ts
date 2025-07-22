import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE_URL = 'http://localhost:8787';
const API_KEY = 'test-api-key'; // You'll need to set this in your test environment

describe('Simple Chatbot API', () => {
  beforeAll(() => {
    // Ensure we have an API key for testing
    if (!API_KEY) {
      throw new Error('API_KEY is required for testing');
    }
  });

  it('should respond to simple chat messages', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        message: 'Hello, what can you help me with?'
      }),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  it('should handle questions about the Cutty app', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        message: 'What is the Cutty app?'
      }),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(data.response.toLowerCase()).toContain('cutty');
  });

  it('should return error for missing message', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Message is required');
  });

  it('should return error for invalid message type', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        message: 123
      }),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Message is required and must be a string');
  });

  it('should return error for message that is too long', async () => {
    const longMessage = 'a'.repeat(5000);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        message: longMessage
      }),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Message is too long');
  });

  it('should require authentication', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello'
      }),
    });

    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error.message).toContain('Authorization');
  });
});