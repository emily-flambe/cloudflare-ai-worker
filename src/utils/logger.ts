import { LogContext } from '../types';

export function createLogContext(request: Request): LogContext {
  return {
    requestId: generateId('req-'),
    method: request.method,
    path: new URL(request.url).pathname,
    userAgent: request.headers.get('User-Agent') || undefined,
    ip: request.headers.get('CF-Connecting-IP') || 
        request.headers.get('X-Forwarded-For') || 
        undefined,
    timestamp: Date.now(),
  };
}

export function logRequest(context: LogContext, message?: string): void {
  const logEntry = {
    level: 'info',
    type: 'request',
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    userAgent: context.userAgent,
    ip: context.ip,
    timestamp: context.timestamp,
    message: message || `${context.method} ${context.path}`,
  };

  console.log(JSON.stringify(logEntry));
}

export function logError(
  context: LogContext,
  error: Error | string,
  details?: Record<string, unknown>
): void {
  const logEntry = {
    level: 'error',
    type: 'error',
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    timestamp: Date.now(),
    error: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    ...details,
  };

  console.error(JSON.stringify(logEntry));
}

export function logResponse(
  context: LogContext,
  status: number,
  duration: number,
  details?: Record<string, unknown>
): void {
  const logEntry = {
    level: 'info',
    type: 'response',
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    status,
    duration,
    timestamp: Date.now(),
    ...details,
  };

  console.log(JSON.stringify(logEntry));
}

export function logSecurity(
  context: LogContext,
  event: string,
  details?: Record<string, unknown>
): void {
  const logEntry = {
    level: 'warn',
    type: 'security',
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    event,
    timestamp: Date.now(),
    ...details,
  };

  console.warn(JSON.stringify(logEntry));
}

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

export function sanitizeForLog(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLog);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function isSensitiveField(key: string): boolean {
  const sensitiveFields = [
    'password',
    'secret',
    'token',
    'key',
    'authorization',
    'auth',
    'bearer',
    'api_key',
    'apikey',
    'credential',
    'private',
  ];

  return sensitiveFields.some(field => 
    key.toLowerCase().includes(field.toLowerCase())
  );
}