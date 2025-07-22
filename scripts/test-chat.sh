#!/bin/bash

# Test script for the AI chat endpoint
# Usage: ./scripts/test-chat.sh
# Set AI_WORKER_API_KEY environment variable or it will prompt you

API_KEY="${AI_WORKER_API_KEY:-}"
URL="https://ai.emilycogsdill.com/api/v1/chat"

# Check if API key is set
if [ -z "$API_KEY" ]; then
    echo "⚠️  AI_WORKER_API_KEY not set in environment"
    printf "Enter your API key: "
    read -r API_KEY
    echo ""
fi

echo "🧪 Testing AI chat endpoint at: $URL"
echo "📋 Using API key: ${API_KEY:0:10}..."
echo ""

# Test messages with proper JSON escaping
test_message() {
    local message=$1
    local description=$2
    local system_prompt=$3
    
    echo "📤 $description"
    echo "Message: \"$message\""
    
    # Create JSON with jq to handle escaping properly
    if [ -n "$system_prompt" ]; then
        echo "System Prompt: \"${system_prompt:0:50}...\""
        json_data=$(jq -n --arg msg "$message" --arg sys "$system_prompt" '{message: $msg, systemPrompt: $sys}')
    else
        json_data=$(jq -n --arg msg "$message" '{message: $msg}')
    fi
    
    response=$(curl -s -X POST "$URL" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$json_data")
    
    if command -v jq &> /dev/null; then
        # Use jq -R to read raw strings and handle control characters
        response_text=$(echo "$response" | jq -r '.response // .error // "Error parsing response"' 2>/dev/null || echo "Error: Unable to parse response")
        # Show first 3 lines of response
        echo "Response: $(echo "$response_text" | head -n 3)..."
    else
        echo "Response: $response"
    fi
    echo ""
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: 'jq' is not installed. Install it for better output formatting."
    echo "   On macOS: brew install jq"
    echo "   On Ubuntu: sudo apt-get install jq"
    echo ""
fi

# Run various tests
echo "=== Testing Different AI Personalities ==="
echo ""

# Test 1: Default assistant
test_message "What is machine learning?" "Test 1: Default AI Assistant"

# Test 2: Pirate personality
test_message "Tell me about the weather" "Test 2: Pirate Captain" "You are a pirate captain. Always speak in pirate dialect and mention ships, treasure, and the sea."

# Test 3: Technical assistant
test_message "How do I sort an array in JavaScript?" "Test 3: Code Assistant" "You are a programming assistant. Provide clear code examples and explanations. Be concise and technical."

# Test 4: Cutty the Cuttlefish
test_message "How do I generate synthetic data?" "Test 4: Cutty the Cuttlefish" "You are Cutty the Cuttlefish, a helpful assistant for the Cutty app that generates synthetic person data. Be friendly and enthusiastic about the app's features."

# Test 5: Customer support
test_message "I need help with my order" "Test 5: Customer Support" "You are a professional customer support agent. Be empathetic and solution-oriented. Always offer to help further."

echo "✅ Testing complete!"
echo ""
echo "💡 To test with your own prompts:"
echo "   curl -X POST $URL \\"
echo "     -H \"Authorization: Bearer \$AI_WORKER_API_KEY\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"message\": \"Your question\", \"systemPrompt\": \"Your custom prompt\"}'"