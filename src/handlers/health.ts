import { Env, HealthResponse, HTTP_STATUS } from '../types';
import { getAvailableModels } from './models';

const startTime = Date.now();

export async function handleHealthRequest(
  _request: Request,
  _env: Env
): Promise<Response> {
  try {
    const now = Date.now();
    const uptime = now - startTime;

    const response: HealthResponse = {
      status: 'healthy',
      timestamp: now,
      version: '1.0.0',
      uptime,
      models: getAvailableModels(),
    };

    return new Response(JSON.stringify(response), {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const response: HealthResponse = {
      status: 'unhealthy',
      timestamp: Date.now(),
      version: '1.0.0',
      uptime: Date.now() - startTime,
      models: getAvailableModels(),
    };

    return new Response(JSON.stringify(response), {
      status: HTTP_STATUS.SERVICE_UNAVAILABLE,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}