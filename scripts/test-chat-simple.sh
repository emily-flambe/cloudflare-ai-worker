#!/bin/bash

# Simple test script for the AI chat endpoint without jq parsing issues
# Usage: ./scripts/test-chat-simple.sh

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

# Simple test function without jq
test_message() {
    local message=$1
    local description=$2
    local system_prompt=$3
    
    echo "📤 $description"
    echo "Message: \"$message\""
    if [ -n "$system_prompt" ]; then
        echo "System Prompt: \"${system_prompt:0:50}...\""
    fi
    
    # Create JSON manually
    if [ -n "$system_prompt" ]; then
        json_data="{\"message\": \"$message\", \"systemPrompt\": \"$system_prompt\"}"
    else
        json_data="{\"message\": \"$message\"}"
    fi
    
    echo "Sending request..."
    response=$(curl -s -X POST "$URL" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$json_data" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status
    http_status=$(echo "$response" | tail -n 1 | cut -d':' -f2)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Success (HTTP $http_status)"
        # Try to extract just the response text using grep/sed
        response_text=$(echo "$response_body" | grep -o '"response":"[^"]*' | sed 's/"response":"//' | head -c 200)
        if [ -n "$response_text" ]; then
            echo "Response preview: $response_text..."
        else
            echo "Response received (use curl directly to see full response)"
        fi
    else
        echo "❌ Error (HTTP $http_status)"
        echo "Response: $response_body"
    fi
    echo ""
}

echo "=== Testing Different AI Personalities ==="
echo ""

# Test 1: Default assistant
test_message "What is 2+2?" "Test 1: Simple Math (Default)"

# Test 2: With system prompt
test_message "What is 2+2?" "Test 2: Math Teacher" "You are a math teacher. Give only the number as the answer."

# Test 3: Cutty
test_message "Hello" "Test 3: Cutty the Cuttlefish" "You are Cutty the Cuttlefish, assistant for the Cutty app. Be enthusiastic!"

echo "✅ Basic testing complete!"
echo ""
echo "💡 For full responses without parsing issues, use curl directly:"
echo "curl -X POST $URL \\"
echo "  -H \"Authorization: Bearer \$AI_WORKER_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"message\": \"Your question\", \"systemPrompt\": \"Optional prompt\"}'"