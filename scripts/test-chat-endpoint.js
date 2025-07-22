#!/usr/bin/env node

/**
 * Test script for the AI chat endpoint
 * Usage: AI_WORKER_API_KEY=your-key node scripts/test-chat-endpoint.js
 * Or set AI_WORKER_API_KEY in your environment
 */

const API_URL = 'https://ai.emilycogsdill.com/api/v1/chat';
const API_KEY = process.env.AI_WORKER_API_KEY || 'your-api-key-here';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test cases with different system prompts
const testCases = [
  {
    name: 'Default AI assistant',
    message: 'What is artificial intelligence?',
    expectSuccess: true
  },
  {
    name: 'Pirate personality',
    message: 'Tell me about the weather',
    systemPrompt: 'You are a pirate captain. Always speak in pirate dialect.',
    expectSuccess: true
  },
  {
    name: 'Code assistant',
    message: 'How do I reverse a string in Python?',
    systemPrompt: 'You are a programming assistant. Provide code examples with explanations.',
    expectSuccess: true
  },
  {
    name: 'Cutty the Cuttlefish',
    message: 'How do I generate synthetic data?',
    systemPrompt: 'You are Cutty the Cuttlefish, assistant for the Cutty app that generates synthetic person data.',
    expectSuccess: true
  },
  {
    name: 'Customer support bot',
    message: 'I need help with my order',
    systemPrompt: 'You are a helpful customer support agent. Be professional and empathetic.',
    expectSuccess: true
  },
  {
    name: 'Long message test',
    message: 'I need help with generating test data for my application. Specifically, I want to create realistic user profiles that include names, addresses, email addresses, and phone numbers. Can you explain how to do this and what options are available for filtering the data?',
    systemPrompt: 'You are a technical documentation assistant. Provide detailed, structured explanations.',
    expectSuccess: true
  }
];

// Error test cases
const errorTestCases = [
  {
    name: 'Missing authorization',
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'This should fail' },
    expectStatus: 401
  },
  {
    name: 'Invalid authorization',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer wrong-key'
    },
    body: { message: 'This should fail' },
    expectStatus: 401
  },
  {
    name: 'Missing message field',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: {},
    expectStatus: 400
  },
  {
    name: 'Invalid message type',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: { message: 123 },
    expectStatus: 400
  },
  {
    name: 'Message too long',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: { message: 'x'.repeat(4001) },
    expectStatus: 400
  }
];

// Helper function to make requests
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data, headers: response.headers };
  } catch (error) {
    return { error: error.message };
  }
}

// Print formatted output
function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Run success tests
async function runSuccessTests() {
  print('\n🧪 Running Success Tests', 'bright');
  print('=' .repeat(50), 'cyan');

  for (const test of testCases) {
    print(`\n📝 Test: ${test.name}`, 'yellow');
    print(`Message: "${test.message}"`, 'blue');
    if (test.systemPrompt) {
      print(`System Prompt: "${test.systemPrompt.substring(0, 60)}..."`, 'cyan');
    }
    
    const startTime = Date.now();
    const payload = { message: test.message };
    if (test.systemPrompt) {
      payload.systemPrompt = test.systemPrompt;
    }
    
    const result = await makeRequest(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    const responseTime = Date.now() - startTime;

    if (result.error) {
      print(`❌ Error: ${result.error}`, 'red');
    } else if (result.status === 200 && result.data.response) {
      print(`✅ Success (${responseTime}ms)`, 'green');
      print(`Response: ${result.data.response.substring(0, 150)}...`, 'cyan');
      
      // Check rate limit headers
      const rateLimit = result.headers.get('X-RateLimit-Remaining');
      if (rateLimit) {
        print(`Rate Limit Remaining: ${rateLimit}`, 'blue');
      }
    } else {
      print(`❌ Unexpected response:`, 'red');
      console.log(result.data);
    }
  }
}

// Run error tests
async function runErrorTests() {
  print('\n\n🚨 Running Error Tests', 'bright');
  print('=' .repeat(50), 'cyan');

  for (const test of errorTestCases) {
    print(`\n📝 Test: ${test.name}`, 'yellow');
    
    const result = await makeRequest(API_URL, {
      method: 'POST',
      headers: test.headers,
      body: JSON.stringify(test.body)
    });

    if (result.status === test.expectStatus) {
      print(`✅ Got expected status: ${result.status}`, 'green');
      if (result.data.error) {
        print(`Error message: ${JSON.stringify(result.data.error)}`, 'cyan');
      }
    } else {
      print(`❌ Expected status ${test.expectStatus}, got ${result.status}`, 'red');
      console.log(result.data);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:8787/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  print('\n🤖 AI Chat Endpoint Test Suite', 'bright');
  print('Testing endpoint: ' + API_URL, 'blue');
  
  // Check API key
  if (API_KEY === 'your-api-key-here') {
    print('\n⚠️  Warning: Using default API key placeholder', 'yellow');
    print('Set your API key: export AI_WORKER_API_KEY=your-actual-key', 'yellow');
    print('Then run: node scripts/test-chat-endpoint.js\n', 'yellow');
  }
  
  // Check if server is reachable
  print('\nChecking API availability...', 'yellow');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    print('\n❌ API is not reachable!', 'red');
    print('Make sure the API is deployed and accessible at:', 'yellow');
    print(API_URL.replace('/api/v1/chat', ''), 'blue');
    process.exit(1);
  }
  
  print('✅ API is reachable', 'green');
  
  // Run tests
  await runSuccessTests();
  await runErrorTests();
  
  print('\n\n✨ All tests completed!', 'bright');
  print('\nTo test manually, try:', 'yellow');
  print(`curl -X POST ${API_URL} \\`, 'cyan');
  print(`  -H "Authorization: Bearer ${API_KEY}" \\`, 'cyan');
  print(`  -H "Content-Type: application/json" \\`, 'cyan');
  print(`  -d '{"message": "Your question here"}'`, 'cyan');
}

// Run the tests
main().catch(error => {
  print(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});