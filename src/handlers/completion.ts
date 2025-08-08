import { Env, CompletionRequest, CompletionResponse, ApiError, HTTP_STATUS, DEFAULT_MODELS, AIRunParameters, AIChatResponse } from '../types';
import { generateId } from '../utils/logger';

export async function handleCompletionRequest(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as CompletionRequest;
    
    const validationError = validateCompletionRequest(body);
    if (validationError) {
      return createErrorResponse(validationError, HTTP_STATUS.BAD_REQUEST);
    }

    const model = body.model || DEFAULT_MODELS.COMPLETION;
    const maxTokens = body.max_tokens || 1024;
    const temperature = body.temperature || 0.7;
    const reasoningEffort = body.reasoning_effort || 'medium';

    const messages = [
      {
        role: 'user' as const,
        content: body.prompt,
      },
    ];


    // Prepare AI run parameters with GPT-OSS reasoning support
    const aiParams: AIRunParameters = {
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    // Add reasoning parameter for GPT-OSS models
    if (model.includes('gpt-oss')) {
      aiParams.reasoning = { effort: reasoningEffort };
    }

    const aiResponse = await env.AI.run(model, aiParams) as AIChatResponse;

    if (!aiResponse || !aiResponse.response) {
      const errorMessage = 'Failed to generate response from AI model';
      
      return createErrorResponse(
        errorMessage,
        HTTP_STATUS.BAD_GATEWAY
      );
    }

    const response: CompletionResponse = {
      id: generateId('cmpl-'),
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          text: aiResponse.response,
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: estimateTokens(body.prompt),
        completion_tokens: aiResponse.usage?.completion_tokens || estimateTokens(aiResponse.response),
        total_tokens: aiResponse.usage?.total_tokens || estimateTokens(body.prompt + aiResponse.response),
      },
    };

    return new Response(JSON.stringify(response), {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Completion request failed:', error);
    return createErrorResponse(
      'Internal server error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

function validateCompletionRequest(body: CompletionRequest): string | null {
  if (!body.prompt) {
    return 'prompt field is required';
  }

  if (typeof body.prompt !== 'string') {
    return 'prompt must be a string';
  }

  if (body.prompt.length === 0) {
    return 'prompt cannot be empty';
  }

  if (body.prompt.length > 32000) {
    return 'prompt is too long (max 32000 characters)';
  }

  if (body.max_tokens && (body.max_tokens < 1 || body.max_tokens > 4096)) {
    return 'max_tokens must be between 1 and 4096';
  }

  if (body.temperature && (body.temperature < 0 || body.temperature > 2)) {
    return 'temperature must be between 0 and 2';
  }

  if (body.reasoning_effort && !['low', 'medium', 'high'].includes(body.reasoning_effort)) {
    return 'reasoning_effort must be one of: low, medium, high';
  }

  return null;
}

function createErrorResponse(message: string, status: number): Response {
  const error: ApiError = {
    error: {
      message,
      type: 'invalid_request_error',
      code: 'invalid_request',
    },
  };

  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}