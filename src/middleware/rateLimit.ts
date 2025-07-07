import { Env, RateLimitInfo, ApiError, HTTP_STATUS, RATE_LIMIT_HEADERS } from '../types';

export async function checkRateLimit(
  request: Request,
  env: Env,
  identifier?: string
): Promise<Response | null> {
  const clientId = identifier || getClientIdentifier(request);
  const rateLimitKey = `rate_limit:${clientId}`;
  
  const maxRequests = parseInt(env.RATE_LIMIT_REQUESTS || '100', 10);
  const windowSeconds = parseInt(env.RATE_LIMIT_WINDOW || '3600', 10);
  const windowMs = windowSeconds * 1000;
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  try {
    const existingData = await env.RATE_LIMIT.get(rateLimitKey);
    let rateLimitInfo: RateLimitInfo;
    
    if (existingData) {
      rateLimitInfo = JSON.parse(existingData);
      
      if (rateLimitInfo.windowStart < windowStart) {
        rateLimitInfo = {
          requests: 1,
          windowStart: now,
          windowEnd: now + windowMs,
        };
      } else {
        rateLimitInfo.requests += 1;
      }
    } else {
      rateLimitInfo = {
        requests: 1,
        windowStart: now,
        windowEnd: now + windowMs,
      };
    }
    
    if (rateLimitInfo.requests > maxRequests) {
      const resetTime = Math.ceil((rateLimitInfo.windowEnd - now) / 1000);
      return createRateLimitExceededResponse(maxRequests, 0, resetTime);
    }
    
    await env.RATE_LIMIT.put(
      rateLimitKey,
      JSON.stringify(rateLimitInfo),
      { expirationTtl: windowSeconds }
    );
    
    return null;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return null;
  }
}

export function createRateLimitExceededResponse(
  limit: number,
  remaining: number,
  resetTime: number
): Response {
  const error: ApiError = {
    error: {
      message: `Rate limit exceeded. Maximum ${limit} requests per hour allowed.`,
      type: 'rate_limit_exceeded',
      code: 'rate_limit_exceeded',
    },
  };

  return new Response(JSON.stringify(error), {
    status: HTTP_STATUS.TOO_MANY_REQUESTS,
    headers: {
      'Content-Type': 'application/json',
      [RATE_LIMIT_HEADERS.LIMIT]: limit.toString(),
      [RATE_LIMIT_HEADERS.REMAINING]: remaining.toString(),
      [RATE_LIMIT_HEADERS.RESET]: resetTime.toString(),
      [RATE_LIMIT_HEADERS.RETRY_AFTER]: resetTime.toString(),
    },
  });
}

export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  resetTime: number
): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  newResponse.headers.set(RATE_LIMIT_HEADERS.LIMIT, limit.toString());
  newResponse.headers.set(RATE_LIMIT_HEADERS.REMAINING, remaining.toString());
  newResponse.headers.set(RATE_LIMIT_HEADERS.RESET, resetTime.toString());

  return newResponse;
}

export function getClientIdentifier(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const [, token] = authHeader.split(' ');
    if (token) {
      return `token:${token.substring(0, 8)}`;
    }
  }
  
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return `ip:${cfConnectingIP}`;
  }
  
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    const ip = xForwardedFor.split(',')[0]?.trim();
    if (ip) {
      return `ip:${ip}`;
    }
  }
  
  return 'anonymous';
}

export async function getRateLimitInfo(
  request: Request,
  env: Env,
  identifier?: string
): Promise<{ limit: number; remaining: number; resetTime: number }> {
  const clientId = identifier || getClientIdentifier(request);
  const rateLimitKey = `rate_limit:${clientId}`;
  
  const maxRequests = parseInt(env.RATE_LIMIT_REQUESTS || '100', 10);
  const windowSeconds = parseInt(env.RATE_LIMIT_WINDOW || '3600', 10);
  const windowMs = windowSeconds * 1000;
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  try {
    const existingData = await env.RATE_LIMIT.get(rateLimitKey);
    
    if (!existingData) {
      return {
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: Math.ceil((now + windowMs - now) / 1000),
      };
    }
    
    const rateLimitInfo: RateLimitInfo = JSON.parse(existingData);
    
    if (rateLimitInfo.windowStart < windowStart) {
      return {
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: Math.ceil((now + windowMs - now) / 1000),
      };
    }
    
    return {
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - rateLimitInfo.requests),
      resetTime: Math.ceil((rateLimitInfo.windowEnd - now) / 1000),
    };
  } catch (error) {
    console.error('Failed to get rate limit info:', error);
    return {
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: Math.ceil(windowSeconds),
    };
  }
}