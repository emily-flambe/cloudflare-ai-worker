import { Env, DEFAULT_MODELS, ReasoningEffortLevel, AIRunParameters, AIChatResponse } from '../types';

export interface SimpleChatRequest {
  message: string;
  systemPrompt?: string;
  model?: string;
  reasoning_effort?: ReasoningEffortLevel;
}

export interface SimpleChatResponse {
  response?: string;
  error?: string;
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

    // Validate reasoning_effort if provided
    if (body.reasoning_effort && !['low', 'medium', 'high'].includes(body.reasoning_effort)) {
      return createSimpleChatResponse({ error: 'reasoning_effort must be one of: low, medium, high' }, 400);
    }

    // Use provided system prompt or default
    const systemPrompt = body.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const model = body.model || DEFAULT_MODELS.CHAT;
    const reasoningEffort = body.reasoning_effort || 'medium';
    
    // Prepare messages for AI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: body.message }
    ];

    // Prepare AI run parameters with GPT-OSS reasoning support
    const aiParams: AIRunParameters = {
      messages,
      max_tokens: 512,
      temperature: 0.7,
    };

    // Add reasoning parameter for GPT-OSS models
    if (model.includes('gpt-oss')) {
      aiParams.reasoning = { effort: reasoningEffort };
    }

    // Call Cloudflare AI
    const aiResponse = await env.AI.run(model, aiParams) as AIChatResponse;

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