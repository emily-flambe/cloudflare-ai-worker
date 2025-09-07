import { 
  ConversationMessage, 
  validateAndTruncateHistory, 
  buildEnhancedInstructions,
  formatConversationHistory 
} from './conversation-utils';

interface Env {
  AI: Ai;
  AI_GATEWAY_ID?: string;
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
  gateway?: {
    skipCache?: boolean;
    cacheTtl?: number;
  };
}

interface OpenAICompatibleRequest {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  gateway?: {
    skipCache?: boolean;
    cacheTtl?: number;
  };
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
            '/api/v1/chat/completions': 'OpenAI-compatible format',
            '/api/v1/models': 'List available models'
          },
          gateway: env.AI_GATEWAY_ID ? {
            enabled: true,
            id: env.AI_GATEWAY_ID,
            features: ['caching', 'rate-limiting', 'analytics', 'fallback']
          } : {
            enabled: false,
            message: 'AI Gateway not configured. Set AI_GATEWAY_ID environment variable to enable.'
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
          const validatedHistory = validateAndTruncateHistory(body.conversationHistory, 90000);
          
          // Build enhanced instructions with conversation context
          enhancedInstructions = buildEnhancedInstructions(body.instructions, validatedHistory);
          
          console.log('Conversation history length:', validatedHistory.length, 'messages');
          console.log('Enhanced instructions length:', enhancedInstructions.length, 'chars');
        }

        // Configure gateway settings with defaults
        const gatewayConfig = env.AI_GATEWAY_ID ? {
          id: env.AI_GATEWAY_ID,
          skipCache: body.gateway?.skipCache ?? false,
          cacheTtl: body.gateway?.cacheTtl ?? 3600  // Default 1 hour cache
        } : undefined;

        const aiResponse = await env.AI.run(model as any, {
          input: body.input,
          instructions: enhancedInstructions,
          reasoning: body.reasoning || { effort: 'medium' }
        }, gatewayConfig ? { gateway: gatewayConfig } : {});

        const response = Response.json(aiResponse);
        return addCorsHeaders(response);
      }

      // OpenAI-compatible chat completions endpoint
      if (url.pathname === '/api/v1/chat/completions' && request.method === 'POST') {
        const body = await request.json() as OpenAICompatibleRequest;
        
        if (!body.messages || !Array.isArray(body.messages)) {
          const response = Response.json(
            { error: 'Missing required field: messages' },
            { status: 400 }
          );
          return addCorsHeaders(response);
        }

        const model = body.model || '@cf/openai/gpt-oss-120b';
        
        // Extract system instructions and conversation history
        let systemInstructions = '';
        const conversationHistory: ConversationMessage[] = [];
        let currentUserMessage = '';
        
        // Process messages to build context
        for (const msg of body.messages) {
          if (msg.role === 'system' && !systemInstructions) {
            // Use first system message as base instructions
            systemInstructions = msg.content;
          } else if (msg.role === 'user' || msg.role === 'assistant') {
            if (msg === body.messages[body.messages.length - 1] && msg.role === 'user') {
              // Last user message is the current input
              currentUserMessage = msg.content;
            } else {
              // Everything else is conversation history
              conversationHistory.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
              });
            }
          }
        }
        
        // If no current user message found, use the last message
        if (!currentUserMessage && body.messages.length > 0) {
          const lastMsg = body.messages[body.messages.length - 1];
          currentUserMessage = lastMsg.content;
        }
        
        // Build enhanced instructions with conversation history
        const enhancedInstructions = buildEnhancedInstructions(
          systemInstructions || 'You are a helpful AI assistant.',
          conversationHistory
        );
        
        console.log('OpenAI endpoint - History length:', conversationHistory.length, 'messages');
        
        // Convert OpenAI format to Responses API format
        // Configure gateway settings with defaults
        const gatewayConfig = env.AI_GATEWAY_ID ? {
          id: env.AI_GATEWAY_ID,
          skipCache: body.gateway?.skipCache ?? false,
          cacheTtl: body.gateway?.cacheTtl ?? 3600  // Default 1 hour cache
        } : undefined;

        const aiResponse = await env.AI.run(model as any, {
          input: currentUserMessage,
          instructions: enhancedInstructions,
          reasoning: { effort: 'medium' }
        }, gatewayConfig ? { gateway: gatewayConfig } : {});

        // Extract the actual response content
        let responseContent = '';
        if (typeof aiResponse === 'string') {
          responseContent = aiResponse;
        } else if (aiResponse && typeof aiResponse === 'object' && 'response' in aiResponse) {
          responseContent = (aiResponse as any).response;
        } else {
          responseContent = JSON.stringify(aiResponse);
        }

        // Convert response to OpenAI-compatible format
        const openaiResponse = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: responseContent
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };

        const response = Response.json(openaiResponse);
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
        
        // Configure gateway settings with defaults for code interpreter (shorter cache due to dynamic nature)
        const gatewayConfig = env.AI_GATEWAY_ID ? {
          id: env.AI_GATEWAY_ID,
          skipCache: body.gateway?.skipCache ?? false,
          cacheTtl: body.gateway?.cacheTtl ?? 300  // Default 5 min cache for code interpreter
        } : undefined;

        const aiResponse = await env.AI.run(model as any, {
          input: body.input,
          instructions: body.instructions || 'You are a helpful AI assistant with code interpreter capabilities. Use code execution when needed to solve mathematical problems, data analysis, or programming tasks.',
          reasoning: { effort: 'high' }
        }, gatewayConfig ? { gateway: gatewayConfig } : {});

        const response = Response.json(aiResponse);
        return addCorsHeaders(response);
      }

      // 404 for unmatched routes
      const response = Response.json(
        { error: 'Endpoint not found', available_endpoints: ['/health', '/api/v1/chat', '/api/v1/chat/completions', '/api/v1/models', '/api/v1/code'] },
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