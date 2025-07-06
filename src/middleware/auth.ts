import { Env, ApiError, HTTP_STATUS } from '../types';

export async function authenticateRequest(
  request: Request,
  env: Env
): Promise<Response | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return createUnauthorizedResponse('Missing Authorization header');
  }

  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer') {
    return createUnauthorizedResponse('Invalid authorization scheme. Use Bearer token');
  }

  if (!token) {
    return createUnauthorizedResponse('Missing API token');
  }

  const expectedToken = env.API_SECRET_KEY;
  if (!expectedToken) {
    console.error('API_SECRET_KEY not configured');
    return createServerErrorResponse('Server configuration error');
  }

  if (token !== expectedToken) {
    return createUnauthorizedResponse('Invalid API token');
  }

  return null;
}

export function createUnauthorizedResponse(message: string): Response {
  const error: ApiError = {
    error: {
      message,
      type: 'authentication_error',
      code: 'invalid_api_key',
    },
  };

  return new Response(JSON.stringify(error), {
    status: HTTP_STATUS.UNAUTHORIZED,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer realm="API"',
    },
  });
}

export function createServerErrorResponse(message: string): Response {
  const error: ApiError = {
    error: {
      message,
      type: 'server_error',
      code: 'internal_error',
    },
  };

  return new Response(JSON.stringify(error), {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  
  return token;
}

export function validateApiKey(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  
  return token === expectedToken;
}