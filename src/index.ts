import { Router } from 'itty-router';
import { Env, HTTP_STATUS } from './types';
import { authenticateRequest } from './middleware/auth';
import { checkRateLimit, getRateLimitInfo, addRateLimitHeaders } from './middleware/rateLimit';
import { handleCorsPreflightRequest, addCorsHeaders } from './middleware/cors';
import { handleChatRequest } from './handlers/chat';
import { handleCompletionRequest } from './handlers/completion';
import { handleEmbeddingRequest } from './handlers/embedding';
import { handleModelsRequest } from './handlers/models';
import { handleHealthRequest } from './handlers/health';
import { handleSurveyNormalizationRequest } from './handlers/surveyNormalization';
import { createLogContext, logRequest, logResponse, logError } from './utils/logger';

const router = Router();

router.options('*', handleCorsPreflightRequest);
router.get('/api/health', handleHealthRequest);
router.get('/api/models', authenticateAndHandle(handleModelsRequest));
router.post('/api/chat', authenticateAndHandle(handleChatRequest));
router.post('/api/complete', authenticateAndHandle(handleCompletionRequest));
router.post('/api/embed', authenticateAndHandle(handleEmbeddingRequest));
router.post('/api/normalize-survey-question', authenticateAndHandle(handleSurveyNormalizationRequest));
router.all('*', handleNotFound);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const startTime = Date.now();
    const logContext = createLogContext(request);
    
    try {
      logRequest(logContext);
      
      const origin = request.headers.get('Origin');
      
      if (request.method === 'OPTIONS') {
        const response = handleCorsPreflightRequest(request, env);
        logResponse(logContext, response.status, Date.now() - startTime);
        return response;
      }
      
      const response = await router.fetch(request, env);
      const finalResponse = addCorsHeaders(response, env, origin || undefined);
      
      logResponse(logContext, finalResponse.status, Date.now() - startTime);
      return finalResponse;
    } catch (error) {
      logError(logContext, error as Error);
      
      const errorResponse = new Response(
        JSON.stringify({
          error: {
            message: 'Internal server error',
            type: 'server_error',
            code: 'internal_error',
          },
        }),
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const finalResponse = addCorsHeaders(errorResponse, env, request.headers.get('Origin') || undefined);
      logResponse(logContext, finalResponse.status, Date.now() - startTime);
      return finalResponse;
    }
  },
};

function authenticateAndHandle(
  handler: (request: Request, env: Env) => Promise<Response>
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const authResult = await authenticateRequest(request, env);
    if (authResult) {
      return authResult;
    }
    
    const rateLimitResult = await checkRateLimit(request, env);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    const response = await handler(request, env);
    
    try {
      const rateLimitInfo = await getRateLimitInfo(request, env);
      return addRateLimitHeaders(
        response,
        rateLimitInfo.limit,
        rateLimitInfo.remaining,
        rateLimitInfo.resetTime
      );
    } catch (error) {
      console.error('Failed to add rate limit headers:', error);
      return response;
    }
  };
}

async function handleNotFound(request: Request, _env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(
      JSON.stringify({
        name: 'Cloudflare AI Worker API',
        version: '1.0.0',
        description: 'AI API service powered by Cloudflare Workers AI',
        endpoints: [
          'GET /api/health - Health check',
          'GET /api/models - List available models',
          'POST /api/chat - Chat completions',
          'POST /api/complete - Text completions',
          'POST /api/embed - Text embeddings',
          'POST /api/normalize-survey-question - Survey question normalization',
        ],
        documentation: 'https://github.com/emily-flambe/ai-worker-api',
      }),
      {
        status: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  return new Response(
    JSON.stringify({
      error: {
        message: `Cannot ${request.method} ${url.pathname}`,
        type: 'not_found',
        code: 'endpoint_not_found',
      },
    }),
    {
      status: HTTP_STATUS.NOT_FOUND,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}