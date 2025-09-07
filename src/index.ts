import { 
  ConversationMessage, 
  validateAndTruncateHistory, 
  buildEnhancedInstructions,
  formatConversationHistory,
  getCharacterLimitForModel,
} from './conversation-utils';

interface Env {
  AI: Ai;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
}

interface ResponsesAPIRequest {
  model?: string;
  input: string | ChatMessage[];
  instructions?: string;
  reasoning?: {
    effort: 'low' | 'medium' | 'high';
  };
  conversationHistory?: ConversationMessage[];
}



function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return addCorsHeaders(new Response(null, { status: 204 }));
    }

    try {
      // Health check endpoint
      if (url.pathname === '/health' || url.pathname === '/') {
        const response = Response.json({
          status: 'healthy',
          service: 'Cloudflare AI Worker - GPT-OSS',
          models: {
            'gpt-oss-120b': '@cf/openai/gpt-oss-120b',
            'gpt-oss-20b': '@cf/openai/gpt-oss-20b'
          },
          endpoints: {
            '/api/v1/chat': 'Responses API format',
            '/api/v1/models': 'List available models'
          },
          timestamp: new Date().toISOString()
        });
        return addCorsHeaders(response);
      }

      // List models endpoint
      if (url.pathname === '/api/v1/models' && request.method === 'GET') {
        const response = Response.json({
          object: 'list',
          data: [
            {
              id: '@cf/openai/gpt-oss-120b',
              object: 'model',
              created: 1722902400,
              owned_by: 'openai',
              context_window: 128000,
              pricing: {
                input: '$0.35 per M tokens',
                output: '$0.75 per M tokens'
              }
            },
            {
              id: '@cf/openai/gpt-oss-20b',
              object: 'model', 
              created: 1722902400,
              owned_by: 'openai',
              context_window: 128000,
              pricing: {
                input: '$0.15 per M tokens',
                output: '$0.35 per M tokens'
              }
            }
          ]
        });
        return addCorsHeaders(response);
      }

      // Main chat endpoint using Responses API format
      if (url.pathname === '/api/v1/chat' && request.method === 'POST') {
        const body = await request.json() as ResponsesAPIRequest;
        
        if (!body.input) {
          const response = Response.json(
            { error: 'Missing required field: input' },
            { status: 400 }
          );
          return addCorsHeaders(response);
        }

        const model = body.model || '@cf/openai/gpt-oss-120b';
        
        // Validate model
        if (!model.includes('@cf/openai/gpt-oss')) {
          const response = Response.json(
            { error: `Invalid model. Supported models: @cf/openai/gpt-oss-120b, @cf/openai/gpt-oss-20b` },
            { status: 400 }
          );
          return addCorsHeaders(response);
        }

        // Handle conversation history if provided
        let enhancedInstructions = body.instructions || 'You are a helpful AI assistant.';
        
        if (body.conversationHistory && body.conversationHistory.length > 0) {
          // Validate and truncate history to prevent token overflow
          const characterLimit = getCharacterLimitForModel(model);
          const truncationResult = validateAndTruncateHistory(body.conversationHistory, characterLimit);
          
          // Handle truncation warning
          if (truncationResult.wasTruncated) {
            const truncationWarning = `Conversation history was truncated: ${truncationResult.originalLength} messages reduced to ${truncationResult.truncatedLength} messages`;
            console.warn(truncationWarning);
            
            // Return a response with truncation warning in metadata
            const warningResponse = {
              warning: 'Conversation history exceeded token limits and was truncated',
              truncationDetails: {
                originalMessages: truncationResult.originalLength,
                truncatedToMessages: truncationResult.truncatedLength,
                characterLimit: characterLimit,
                recommendation: 'Consider summarizing or reducing conversation history to maintain full context'
              }
            };
            
            // Add warning to the AI response metadata (will be handled later)
            (request as any)._truncationWarning = warningResponse;
          }
          
          const validatedHistory = truncationResult.history;
          
          // Build enhanced instructions with conversation context
          enhancedInstructions = buildEnhancedInstructions(body.instructions, validatedHistory);
          
          console.log('Conversation history length:', validatedHistory.length, 'messages');
          console.log('Enhanced instructions length:', enhancedInstructions.length, 'chars');
        }

        const aiResponse = await env.AI.run(model as any, {
          input: body.input,
          instructions: enhancedInstructions,
          reasoning: body.reasoning || { effort: 'medium' }
        });

        // Add truncation warning to response if applicable
        let finalResponse = aiResponse;
        if ((request as any)._truncationWarning) {
          finalResponse = {
            ...aiResponse,
            metadata: {
              ...(typeof aiResponse === 'object' && aiResponse.metadata ? aiResponse.metadata : {}),
              conversationHistory: (request as any)._truncationWarning
            }
          };
        }

        const response = Response.json(finalResponse);
        return addCorsHeaders(response);
      }


      // Code interpreter endpoint
      if (url.pathname === '/api/v1/code' && request.method === 'POST') {
        const body = await request.json() as ResponsesAPIRequest;
        
        if (!body.input) {
          const response = Response.json(
            { error: 'Missing required field: input' },
            { status: 400 }
          );
          return addCorsHeaders(response);
        }

        const model = body.model || '@cf/openai/gpt-oss-120b';
        
        const aiResponse = await env.AI.run(model as any, {
          input: body.input,
          instructions: body.instructions || 'You are a helpful AI assistant with code interpreter capabilities. Use code execution when needed to solve mathematical problems, data analysis, or programming tasks.',
          reasoning: { effort: 'high' }
        });

        const response = Response.json(aiResponse);
        return addCorsHeaders(response);
      }

      // 404 for unmatched routes
      const response = Response.json(
        { error: 'Endpoint not found', available_endpoints: ['/health', '/api/v1/chat', '/api/v1/models', '/api/v1/code'] },
        { status: 404 }
      );
      return addCorsHeaders(response);
      
    } catch (error: any) {
      console.error('Error:', error);
      const response = Response.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
  },
} satisfies ExportedHandler<Env>;