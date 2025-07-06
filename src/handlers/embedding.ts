import { Env, EmbeddingRequest, EmbeddingResponse, ApiError, HTTP_STATUS, DEFAULT_MODELS } from '../types';

export async function handleEmbeddingRequest(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as EmbeddingRequest;
    
    const validationError = validateEmbeddingRequest(body);
    if (validationError) {
      return createErrorResponse(validationError, HTTP_STATUS.BAD_REQUEST);
    }

    const model = body.model || DEFAULT_MODELS.EMBEDDING;
    const inputs = Array.isArray(body.input) ? body.input : [body.input];

    const embeddings = await Promise.all(
      inputs.map(async (input, index) => {
        try {
          const aiResponse = await env.AI.run(model, {
            text: input,
          });

          if (!aiResponse || !aiResponse.data || !Array.isArray(aiResponse.data)) {
            throw new Error('Invalid embedding response from AI model');
          }

          return {
            object: 'embedding',
            embedding: aiResponse.data,
            index,
          };
        } catch (error) {
          console.error(`Embedding failed for input ${index}:`, error);
          throw new Error(`Failed to generate embedding for input ${index}`);
        }
      })
    );

    const totalTokens = inputs.reduce((sum, input) => sum + estimateTokens(input), 0);

    const response: EmbeddingResponse = {
      object: 'list',
      data: embeddings,
      model,
      usage: {
        prompt_tokens: totalTokens,
        total_tokens: totalTokens,
      },
    };

    return new Response(JSON.stringify(response), {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Embedding request failed:', error);
    return createErrorResponse(
      'Internal server error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

function validateEmbeddingRequest(body: EmbeddingRequest): string | null {
  if (!body.input) {
    return 'input field is required';
  }

  const inputs = Array.isArray(body.input) ? body.input : [body.input];
  
  if (inputs.length === 0) {
    return 'input cannot be empty';
  }

  if (inputs.length > 100) {
    return 'Cannot process more than 100 inputs at once';
  }

  for (const [index, input] of inputs.entries()) {
    if (typeof input !== 'string') {
      return `Input at index ${index} must be a string`;
    }

    if (input.length === 0) {
      return `Input at index ${index} cannot be empty`;
    }

    if (input.length > 8192) {
      return `Input at index ${index} is too long (max 8192 characters)`;
    }
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