interface Env {
  AI: Ai;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages?: ChatMessage[];
  input?: ChatMessage[];
  model?: string;
  reasoning?: {
    effort: 'low' | 'medium' | 'high';
  };
  max_tokens?: number;
  temperature?: number;
}

interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        models: ['@cf/openai/gpt-oss-120b', '@cf/openai/gpt-oss-20b']
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Chat endpoint
    if (url.pathname === '/chat' && request.method === 'POST') {
      try {
        const body = await request.json() as ChatRequest;
        
        const messages = body.messages || body.input;
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return new Response(JSON.stringify({
            error: { message: 'Messages or input are required and must be a non-empty array' }
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const model = body.model || '@cf/openai/gpt-oss-120b';
        
        // Prepare the AI request using the format from the Cloudflare blog
        const aiParams: any = {
          input: messages,
          max_tokens: body.max_tokens || 1024,
          temperature: body.temperature || 0.7,
        };

        // Add reasoning parameter for GPT-OSS models as shown in the blog
        if (model.includes('gpt-oss')) {
          aiParams.reasoning = body.reasoning || { effort: 'medium' };
        }

        // Call the AI model using Workers AI binding
        const aiResponse = await env.AI.run(model as any, aiParams) as any;
        
        if (!aiResponse || !aiResponse.output) {
          throw new Error(`Invalid AI response: ${JSON.stringify(aiResponse)}`);
        }

        // Extract message content from GPT-OSS response structure
        const messageOutput = aiResponse.output.find((item: any) => item.type === 'message');
        const content = messageOutput?.content?.find((c: any) => c.type === 'output_text')?.text;
        
        if (!content) {
          throw new Error(`No message content found in response: ${JSON.stringify(aiResponse)}`);
        }

        // Format response to match OpenAI format
        const response: ChatResponse = {
          id: aiResponse.id || `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: aiResponse.created_at || Math.floor(Date.now() / 1000),
          model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: content
            },
            finish_reason: 'stop'
          }]
        };

        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });

      } catch (error) {
        console.error('Chat request failed:', error);
        return new Response(JSON.stringify({
          error: { 
            message: error instanceof Error ? error.message : 'Internal server error'
          }
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};