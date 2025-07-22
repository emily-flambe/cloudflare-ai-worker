import { Env, DEFAULT_MODELS } from '../types';

export interface SimpleChatRequest {
  message: string;
  systemPrompt?: string;
}

export interface SimpleChatResponse {
  response: string;
  error?: string;
}

interface AIChatResponse {
  response: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Please provide clear, accurate, and helpful responses.`;

export async function handleSimpleChatbotRequest(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as SimpleChatRequest;
    
    // Validate request
    if (!body.message || typeof body.message !== 'string') {
      return createSimpleChatResponse({ error: 'Message is required and must be a string' }, 400);
    }

    if (body.message.length > 4000) {
      return createSimpleChatResponse({ error: 'Message is too long (max 4000 characters)' }, 400);
    }

    // Use provided system prompt or default
    const systemPrompt = body.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    
    // Prepare messages for AI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: body.message }
    ];

    // Call Cloudflare AI
    const aiResponse = await env.AI.run(DEFAULT_MODELS.CHAT, {
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }) as AIChatResponse;

    if (!aiResponse || !aiResponse.response) {
      console.error('AI response missing or invalid:', aiResponse);
      return createSimpleChatResponse({ 
        error: 'Sorry, I encountered an error. Please try again.' 
      }, 500);
    }

    return createSimpleChatResponse({ 
      response: aiResponse.response 
    });

  } catch (error) {
    console.error('Simple chatbot request failed:', error);
    return createSimpleChatResponse({ 
      error: 'Sorry, I encountered an error. Please try again.' 
    }, 500);
  }
}

function createSimpleChatResponse(
  data: SimpleChatResponse, 
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}