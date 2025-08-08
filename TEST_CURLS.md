# Test cURL Commands

## API Endpoints

### Health Check

```bash
curl https://ai-worker.emily-cogsdill.workers.dev/health
```

### List Models

```bash
curl https://ai-worker.emily-cogsdill.workers.dev/api/v1/models
```

### Chat (Responses API)

Basic chat:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"input": "Your question here"}'
```

Chat with custom model:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"input": "Explain quantum computing", "model": "@cf/openai/gpt-oss-20b"}'
```

Chat with instructions and reasoning:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is machine learning?",
    "instructions": "You are an expert data scientist. Explain concepts clearly with examples.",
    "reasoning": {"effort": "high"}
  }'
```

### Chat (OpenAI-Compatible)

Basic chat:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

Chat with system message:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"}
    ]
  }'
```

### Code Interpreter

Basic code execution:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/code \
  -H "Content-Type: application/json" \
  -d '{"input": "Calculate the sum of prime numbers from 1 to 100"}'
```

Data analysis example:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/code \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Create a Python script that analyzes this dataset: [1,2,3,4,5,6,7,8,9,10] and calculates mean, median, and standard deviation"
  }'
```

## Test Scenarios

### Error Testing

Missing input field:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{}'
```

Invalid model:
```bash
curl -X POST https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"input": "Test", "model": "invalid-model"}'
```

### CORS Testing

OPTIONS preflight request:
```bash
curl -X OPTIONS https://ai-worker.emily-cogsdill.workers.dev/api/v1/chat \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## Production URL

All commands use the production URL: **https://ai-worker.emily-cogsdill.workers.dev**

For local testing, replace with: **http://localhost:8787**