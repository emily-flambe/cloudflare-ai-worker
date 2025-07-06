import { Env } from '../types';

export function createCorsHeaders(env: Env, origin?: string): Record<string, string> {
  const allowedOrigins = env.ALLOWED_ORIGINS || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  if (allowedOrigins === '*') {
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  } else {
    const allowedOriginList = allowedOrigins.split(',').map(o => o.trim());
    if (origin && allowedOriginList.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return corsHeaders;
}

export function handleCorsPreflightRequest(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');
  const corsHeaders = createCorsHeaders(env, origin || undefined);
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function addCorsHeaders(response: Response, env: Env, origin?: string): Response {
  const corsHeaders = createCorsHeaders(env, origin);
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

export function isOriginAllowed(origin: string, allowedOrigins: string): boolean {
  if (allowedOrigins === '*') return true;
  
  const allowedOriginList = allowedOrigins.split(',').map(o => o.trim());
  return allowedOriginList.includes(origin);
}