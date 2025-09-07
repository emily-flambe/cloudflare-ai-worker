# Cloudflare AI Worker - Example cURL Commands

This document contains comprehensive examples for using the Cloudflare AI Worker API.

## Table of Contents

1. [Basic Endpoints](#basic-endpoints)
2. [Chat Endpoint (Responses API)](#chat-endpoint-responses-api)
3. [Code Interpreter](#code-interpreter)
4. [Conversation History Examples](#conversation-history-examples)
5. [Error Testing](#error-testing)
6. [CORS Testing](#cors-testing)

## Basic Endpoints

### Health Check
```bash
curl https://ai-worker.emily-cogsdill.workers.dev/health
```

### List Available Models
```bash
curl https://ai-worker.emily-cogsdill.workers.dev/api/v1/models
```

## Chat Endpoint (Responses API)

### Basic Chat
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"input": "What is artificial intelligence?"}'
```

### With Custom Model (20B)
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Explain quantum computing",
    "model": "@cf/openai/gpt-oss-20b"
  }'
```

### With Custom Instructions
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is machine learning?",
    "instructions": "You are an expert data scientist. Explain concepts clearly with practical examples.",
    "reasoning": {"effort": "high"}
  }'
```

### With Different Reasoning Levels
```bash
# Low effort (fast, simple responses)
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is 2+2?",
    "reasoning": {"effort": "low"}
  }'

# Medium effort (default, balanced)
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Explain the water cycle",
    "reasoning": {"effort": "medium"}
  }'

# High effort (detailed, thoughtful)
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Analyze the pros and cons of renewable energy",
    "reasoning": {"effort": "high"}
  }'
```

## Code Interpreter

### Basic Code Execution
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/code \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Calculate the sum of prime numbers from 1 to 100"
  }'
```

### Data Analysis Example
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/code \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Create a Python script that analyzes this dataset: [1,2,3,4,5,6,7,8,9,10] and calculates mean, median, and standard deviation"
  }'
```

### Complex Algorithm
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/code \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Implement a binary search tree in Python with insert, search, and delete operations",
    "instructions": "Include proper error handling and edge cases"
  }'
```

## Conversation History Examples

### Simple Conversation History (Responses API)
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What did I tell you my name was?",
    "conversationHistory": [
      {"role": "user", "content": "Hi, my name is Alice"},
      {"role": "assistant", "content": "Hello Alice! Nice to meet you."}
    ]
  }'
```

### Extended Conversation History
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Can you summarize our conversation so far?",
    "conversationHistory": [
      {"role": "user", "content": "Hi, my name is Bob and I work in tech"},
      {"role": "assistant", "content": "Hello Bob! Nice to meet you. Working in tech must be exciting."},
      {"role": "user", "content": "Yes, I specifically work on machine learning projects"},
      {"role": "assistant", "content": "Machine learning is a fascinating field! What kind of ML projects are you working on?"},
      {"role": "user", "content": "Mostly computer vision for autonomous vehicles"},
      {"role": "assistant", "content": "Computer vision for autonomous vehicles is cutting-edge work!"}
    ]
  }'
```


## Error Testing

### Missing Input Field
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expected: 400 Bad Request with error message

### Invalid Model
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Test",
    "model": "invalid-model"
  }'
```
Expected: 400 Bad Request with supported models list

### Invalid Endpoint
```bash
curl https://ai-worker.emily-cogsdill.workers.dev/api/v1/invalid
```
Expected: 404 Not Found with available endpoints

## CORS Testing

### OPTIONS Preflight Request
```bash
curl -X OPTIONS https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```
Expected: 204 No Content with proper CORS headers

### Cross-Origin Request
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"input": "Test CORS"}' \
  -v
```
Expected: 200 OK with Access-Control-Allow-Origin header

## Local Development

Replace `https://ai-worker.emily-cogsdill.workers.dev` with `http://localhost:8787` for local testing.

## Response Format Examples

### Responses API Format
```json
{
  "id": "resp_...",
  "response": "The actual response text",
  "reasoning": {...},
  "metadata": {...}
}
```


## Tips for Using Conversation History

1. **Token Limits**: The models have a 128K token context window. Keep conversation history reasonable to leave room for responses.

2. **Message Order**: Messages should be in chronological order, with the current query as the `input` field (not in the history).

3. **Role Consistency**: Use `user` and `assistant` roles consistently in the conversation history.

4. **Performance**: Longer conversation histories will use more tokens and may be slower/more expensive.