import { Env, ModelsResponse, ModelInfo, HTTP_STATUS, MODELS } from '../types';

export async function handleModelsRequest(
  _request: Request,
  _env: Env
): Promise<Response> {
  try {
    const models: ModelInfo[] = [
      {
        id: MODELS.CHAT.GPT_OSS_120B,
        object: 'model',
        created: 1677610602,
        owned_by: 'openai',
        permission: [
          {
            id: 'modelperm-default',
            object: 'model_permission',
            created: 1677610602,
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: true,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false,
          },
        ],
        root: MODELS.CHAT.GPT_OSS_120B,
        parent: null,
      },
      {
        id: MODELS.CHAT.GPT_OSS_20B,
        object: 'model',
        created: 1677610602,
        owned_by: 'openai',
        permission: [
          {
            id: 'modelperm-default',
            object: 'model_permission',
            created: 1677610602,
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: true,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false,
          },
        ],
        root: MODELS.CHAT.GPT_OSS_20B,
        parent: null,
      },
      {
        id: MODELS.EMBEDDING.BGE_BASE,
        object: 'model',
        created: 1677610602,
        owned_by: 'cloudflare',
        permission: [
          {
            id: 'modelperm-default',
            object: 'model_permission',
            created: 1677610602,
            allow_create_engine: false,
            allow_sampling: false,
            allow_logprobs: false,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false,
          },
        ],
        root: MODELS.EMBEDDING.BGE_BASE,
        parent: null,
      },
    ];

    const response: ModelsResponse = {
      object: 'list',
      data: models,
    };

    return new Response(JSON.stringify(response), {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Models request failed:', error);
    return new Response(
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
  }
}

export function getAvailableModels() {
  return {
    chat: [MODELS.CHAT.GPT_OSS_120B, MODELS.CHAT.GPT_OSS_20B],
    completion: [MODELS.CHAT.GPT_OSS_120B, MODELS.CHAT.GPT_OSS_20B],
    embedding: [MODELS.EMBEDDING.BGE_BASE],
  };
}