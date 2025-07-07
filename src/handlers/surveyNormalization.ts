import { Env, SurveyNormalizationRequest, SurveyNormalizationResponse, NormalizationSuggestion, ApiError, HTTP_STATUS, DEFAULT_MODELS } from '../types';
import { generateId } from '../utils/logger';

export async function handleSurveyNormalizationRequest(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as SurveyNormalizationRequest;
    
    const validationError = validateSurveyNormalizationRequest(body);
    if (validationError) {
      return createErrorResponse(validationError, HTTP_STATUS.BAD_REQUEST);
    }

    const model = DEFAULT_MODELS.CHAT; // @cf/meta/llama-3.1-8b-instruct
    
    const systemPrompt = createSystemPrompt(body.category, body.context);
    const userPrompt = createUserPrompt(body.question);

    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      {
        role: 'user' as const,
        content: userPrompt,
      },
    ];

    const aiResponse = await env.AI.run(model as any, {
      messages,
      max_tokens: 1024,
      temperature: 0.3, // Lower temperature for more consistent normalization
    }) as any;

    if (!aiResponse || !aiResponse.success || !aiResponse.result?.response) {
      const errorMessage = aiResponse?.errors?.length > 0 
        ? `AI model error: ${aiResponse.errors.map((e: any) => e.message || e).join(', ')}`
        : 'Failed to generate response from AI model';
      
      return createErrorResponse(
        errorMessage,
        HTTP_STATUS.BAD_GATEWAY
      );
    }

    const parsedResult = parseAIResponse(aiResponse.result.response);
    if (!parsedResult) {
      return createErrorResponse(
        'Failed to parse AI response for survey normalization',
        HTTP_STATUS.BAD_GATEWAY
      );
    }

    const response: SurveyNormalizationResponse = {
      id: generateId('norm-'),
      object: 'survey_normalization',
      created: Math.floor(Date.now() / 1000),
      original_question: body.question,
      normalized_question: parsedResult.normalized_question,
      confidence_score: parsedResult.confidence_score,
      category: body.category || parsedResult.category,
      suggestions: parsedResult.suggestions,
      usage: {
        prompt_tokens: estimateTokens(systemPrompt + userPrompt),
        completion_tokens: estimateTokens(aiResponse.result.response),
        total_tokens: estimateTokens(systemPrompt + userPrompt + aiResponse.result.response),
      },
    };

    return new Response(JSON.stringify(response), {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Survey normalization request failed:', error);
    return createErrorResponse(
      'Internal server error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

function validateSurveyNormalizationRequest(body: SurveyNormalizationRequest): string | null {
  if (!body.question) {
    return 'question field is required';
  }

  if (typeof body.question !== 'string') {
    return 'question must be a string';
  }

  if (body.question.length === 0) {
    return 'question cannot be empty';
  }

  if (body.question.length > 1000) {
    return 'question is too long (max 1000 characters)';
  }

  if (body.category && typeof body.category !== 'string') {
    return 'category must be a string';
  }

  if (body.context && typeof body.context !== 'string') {
    return 'context must be a string';
  }

  if (body.category && body.category.length > 100) {
    return 'category is too long (max 100 characters)';
  }

  if (body.context && body.context.length > 500) {
    return 'context is too long (max 500 characters)';
  }

  return null;
}

function createSystemPrompt(category?: string, context?: string): string {
  let basePrompt = `You are a survey question normalization expert. Your task is to standardize survey questions to improve consistency and reduce ambiguity.

Guidelines:
1. Normalize questions to use clear, professional language
2. Remove bias, leading language, and ambiguous terms
3. Ensure questions are specific and measurable
4. Maintain the original intent while improving clarity
5. Use standardized formats for common question types

Response format (JSON):
{
  "normalized_question": "The standardized version of the question",
  "confidence_score": 0.95,
  "category": "determined_category",
  "suggestions": [
    {
      "question": "The standardized version of the question",
      "confidence": 0.95,
      "reasoning": "Explanation of why this normalization was chosen"
    }
  ]
}`;

  if (category) {
    basePrompt += `\n\nCategory context: This question is for ${category} surveys.`;
  }

  if (context) {
    basePrompt += `\n\nAdditional context: ${context}`;
  }

  return basePrompt;
}

function createUserPrompt(question: string): string {
  return `Please normalize this survey question: "${question}"

Return only the JSON response as specified in the system prompt.`;
}

function parseAIResponse(response: string): {
  normalized_question: string;
  confidence_score: number;
  category?: string;
  suggestions: NormalizationSuggestion[];
} | null {
  try {
    // Extract JSON from response if it contains additional text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields
    if (!parsed.normalized_question || typeof parsed.normalized_question !== 'string') {
      return null;
    }
    
    if (typeof parsed.confidence_score !== 'number' || parsed.confidence_score < 0 || parsed.confidence_score > 1) {
      return null;
    }
    
    if (!Array.isArray(parsed.suggestions)) {
      return null;
    }
    
    // Validate suggestions
    for (const suggestion of parsed.suggestions) {
      if (!suggestion.question || typeof suggestion.question !== 'string') {
        return null;
      }
      if (typeof suggestion.confidence !== 'number' || suggestion.confidence < 0 || suggestion.confidence > 1) {
        return null;
      }
      if (!suggestion.reasoning || typeof suggestion.reasoning !== 'string') {
        return null;
      }
    }
    
    return {
      normalized_question: parsed.normalized_question,
      confidence_score: parsed.confidence_score,
      category: parsed.category,
      suggestions: parsed.suggestions,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
}

function createErrorResponse(message: string, status: number): Response {
  const error: ApiError = {
    error: {
      message,
      type: 'invalid_request_error',
      code: 'invalid_request',
    },
  };

  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}