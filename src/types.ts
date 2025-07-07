export interface Env {
  AI: Ai;
  RATE_LIMIT: KVNamespace;
  SECRETS_STORE: any; // Secrets Store binding
  API_SECRET_KEY?: string; // Optional fallback, will be removed
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  ENVIRONMENT?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CompletionRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    text: string;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: Array<{
    id: string;
    object: string;
    created: number;
    allow_create_engine: boolean;
    allow_sampling: boolean;
    allow_logprobs: boolean;
    allow_search_indices: boolean;
    allow_view: boolean;
    allow_fine_tuning: boolean;
    organization: string;
    group: string | null;
    is_blocking: boolean;
  }>;
  root: string;
  parent: string | null;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface ApiError {
  error: {
    message: string;
    type: string;
    code?: string;
    param?: string;
  };
}

export interface RateLimitInfo {
  requests: number;
  windowStart: number;
  windowEnd: number;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
  version: string;
  uptime: number;
  models: {
    chat: string[];
    completion: string[];
    embedding: string[];
  };
}

export interface LogContext {
  requestId: string;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  timestamp: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export const MODELS = {
  CHAT: {
    LLAMA_3_1_8B: '@cf/meta/llama-3.1-8b-instruct',
    MISTRAL_7B: '@cf/mistral/mistral-7b-instruct-v0.1',
  },
  EMBEDDING: {
    BGE_BASE: '@cf/baai/bge-base-en-v1.5',
  },
} as const;

export const DEFAULT_MODELS = {
  CHAT: MODELS.CHAT.LLAMA_3_1_8B,
  COMPLETION: MODELS.CHAT.LLAMA_3_1_8B,
  EMBEDDING: MODELS.EMBEDDING.BGE_BASE,
} as const;

export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export interface SurveyNormalizationRequest {
  question: string;
  category?: string;
  context?: string;
}

export interface NormalizationSuggestion {
  question: string;
  confidence: number;
  reasoning: string;
}

export interface SurveyNormalizationResponse {
  id: string;
  object: string;
  created: number;
  original_question: string;
  normalized_question: string;
  confidence_score: number;
  category?: string;
  suggestions: NormalizationSuggestion[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}