# AI Chat Endpoint - cURL Examples

This document provides curl commands to test the AI chat endpoint with various personalities and system prompts.

## Prerequisites

Set your API key as an environment variable:
```bash
export AI_WORKER_API_KEY="your-api-key-here"
```

## Basic Examples

### 1. Default AI Assistant
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is machine learning?"}'
```

### 2. Simple Math Question
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?"}'
```

## Custom Personalities

### 3. Pirate Captain
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about the weather",
    "systemPrompt": "You are a pirate captain. Always speak in pirate dialect and mention ships, treasure, and the sea."
  }'
```

### 4. Code Assistant
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I sort an array in JavaScript?",
    "systemPrompt": "You are a programming assistant. Provide clear code examples and explanations. Be concise and technical."
  }'
```

### 5. Math Teacher
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is 2+2?",
    "systemPrompt": "You are a math teacher. Give only the number as the answer."
  }'
```

### 6. Cutty the Cuttlefish
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I generate synthetic data?",
    "systemPrompt": "You are Cutty the Cuttlefish, a helpful assistant for the Cutty app that generates synthetic person data. Be friendly and enthusiastic. You are a playful cuttlefish character."
  }'
```

### 7. Customer Support Agent
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help with my order",
    "systemPrompt": "You are a professional customer support agent. Be empathetic and solution-oriented. Always offer to help further."
  }'
```

### 8. Technical Documentation Assistant
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain REST APIs",
    "systemPrompt": "You are a technical documentation assistant. Provide detailed, structured explanations with examples. Use markdown formatting."
  }'
```

## Error Testing

### 9. Missing Authorization
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "This should fail"}'
```

### 10. Invalid API Key
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer invalid-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"message": "This should fail"}'
```

### 11. Missing Message Field
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 12. Message Too Long
```bash
curl -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$(printf 'x%.0s' {1..4001})\"}"
```

## Formatting Output

### Pretty Print with jq (if responses are valid JSON)
```bash
curl -s -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}' | jq -r '.response' 2>/dev/null || echo "Failed to parse"
```

### Save Response to File
```bash
curl -s -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Write a short story"}' > response.json
```

### Show HTTP Status Code
```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Verbose Output (for debugging)
```bash
curl -v -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## Rate Limit Information

### Check Rate Limit Headers
```bash
curl -s -D - -X POST https://ai.emilycogsdill.com/api/v1/chat \
  -H "Authorization: Bearer $AI_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}' | grep -i "x-ratelimit"
```

## Tips

1. **API Key**: Store your API key in an environment variable for security
2. **JSON Escaping**: Be careful with quotes and special characters in messages
3. **Response Parsing**: AI responses may contain newlines and special characters that break JSON parsing
4. **Rate Limits**: Default is 100 requests per hour per API key
5. **Timeouts**: Add `-m 30` for a 30-second timeout on long requests

## Quick Test All Personalities

```bash
#!/bin/bash
# Save as test-all.sh and run with your API key

personalities=(
  "Default|What is AI?|"
  "Pirate|Tell me a joke|You are a pirate captain. Speak in pirate dialect."
  "Teacher|Explain gravity|You are a physics teacher. Be educational."
  "Cutty|How do I use the app?|You are Cutty the Cuttlefish, assistant for the Cutty app."
)

for p in "${personalities[@]}"; do
  IFS='|' read -r name msg prompt <<< "$p"
  echo "Testing: $name"
  
  if [ -z "$prompt" ]; then
    curl -s -X POST https://ai.emilycogsdill.com/api/v1/chat \
      -H "Authorization: Bearer $AI_WORKER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"$msg\"}" | head -c 100
  else
    curl -s -X POST https://ai.emilycogsdill.com/api/v1/chat \
      -H "Authorization: Bearer $AI_WORKER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"$msg\", \"systemPrompt\": \"$prompt\"}" | head -c 100
  fi
  
  echo -e "\n---\n"
done
```