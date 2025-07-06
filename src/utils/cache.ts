import { CacheOptions } from '../types';

export class ResponseCache {
  private cache: Map<string, { data: unknown; expires: number; tags: string[] }>;
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key: string, data: unknown, options: CacheOptions = {}): void {
    const ttl = options.ttl || 300000; // 5 minutes default
    const tags = options.tags || [];
    const expires = Date.now() + ttl;

    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, { data, expires, tags });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  evictByTag(tag: string): number {
    let evicted = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
        evicted++;
      }
    }
    return evicted;
  }

  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  private evictOldest(): void {
    const oldest = this.cache.keys().next().value;
    if (oldest) {
      this.cache.delete(oldest);
    }
  }

  size(): number {
    return this.cache.size;
  }

  stats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export function createCacheKey(
  method: string,
  path: string,
  params?: Record<string, unknown>
): string {
  const baseKey = `${method}:${path}`;
  if (!params) return baseKey;

  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('&');

  return `${baseKey}?${paramString}`;
}

export function shouldCacheRequest(request: Request): boolean {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  
  if (method !== 'GET' && method !== 'HEAD') {
    return false;
  }

  if (url.searchParams.has('no-cache')) {
    return false;
  }

  const cacheControl = request.headers.get('Cache-Control');
  if (cacheControl && cacheControl.includes('no-cache')) {
    return false;
  }

  return true;
}

export function shouldCacheResponse(response: Response): boolean {
  if (!response.ok) return false;

  const cacheControl = response.headers.get('Cache-Control');
  if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('private'))) {
    return false;
  }

  return true;
}

export function addCacheHeaders(response: Response, ttl: number): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  newResponse.headers.set('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
  newResponse.headers.set('Expires', new Date(Date.now() + ttl).toUTCString());

  return newResponse;
}

const globalCache = new ResponseCache();

export { globalCache };