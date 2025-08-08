interface SecretsStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  AI: Ai;
  RATE_LIMIT: KVNamespace;
  SECRETS_STORE: SecretsStore; // Secrets Store binding
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

// GPT-OSS specific types
export type ReasoningEffortLevel = 'low' | 'medium' | 'high';

export interface GPTOSSModelInfo {
  id: string;
  total_parameters: string;
  active_parameters_per_token: string;
  description: string;
}

// GPT-OSS models - using existing models as placeholders until GPT-OSS is available
export const GPT_OSS_MODELS = {
  PRODUCTION: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', // Placeholder for @cf/openai/gpt-oss-120b
  EDGE: '@cf/meta/llama-3.1-8b-instruct', // Placeholder for @cf/openai/gpt-oss-20b
} as const;

export const GPT_OSS_MODEL_INFO: Record<string, GPTOSSModelInfo> = {
  [GPT_OSS_MODELS.PRODUCTION]: {
    id: '@cf/openai/gpt-oss-120b', // Target GPT-OSS model
    total_parameters: '117B',
    active_parameters_per_token: '5.1B',
    description: 'Production GPT-OSS model with 117B total parameters and 5.1B active per token (currently using Llama 3.3 70B as placeholder)'
  },
  [GPT_OSS_MODELS.EDGE]: {
    id: '@cf/openai/gpt-oss-20b', // Target GPT-OSS model
    total_parameters: '21B',
    active_parameters_per_token: '3.6B',
    description: 'Edge GPT-OSS model with 21B total parameters and 3.6B active per token (currently using Llama 3.1 8B as placeholder)'
  }
} as const;

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  reasoning_effort?: ReasoningEffortLevel;
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
  reasoning_effort?: ReasoningEffortLevel;
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
    GPT_OSS_120B: GPT_OSS_MODELS.PRODUCTION,
    GPT_OSS_20B: GPT_OSS_MODELS.EDGE,
  },
  EMBEDDING: {
    BGE_BASE: '@cf/baai/bge-base-en-v1.5',
  },
} as const;

export const DEFAULT_MODELS = {
  CHAT: MODELS.CHAT.GPT_OSS_120B,
  COMPLETION: MODELS.CHAT.GPT_OSS_120B,
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