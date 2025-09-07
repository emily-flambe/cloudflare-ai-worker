// Utility functions for handling conversation history

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function formatConversationHistory(conversationHistory: ConversationMessage[]): string {
  if (!conversationHistory || conversationHistory.length === 0) {
    return '';
  }

  const contextLines = [
    "=== CONVERSATION HISTORY ===",
    "IMPORTANT: You MUST remember and refer to the following conversation history.",
    "The user expects you to maintain context from previous messages.",
    "",
    "Previous messages in this conversation:"
  ];

  let messageNumber = 1;
  conversationHistory.forEach((msg) => {
    if (msg.role === 'user') {
      contextLines.push(`\n[Message ${messageNumber} - User]:`);
      contextLines.push(msg.content);
      messageNumber++;
    } else if (msg.role === 'assistant') {
      contextLines.push(`[Your Previous Response]:`);
      contextLines.push(msg.content);
    }
  });

  contextLines.push(
    "\n=== END OF HISTORY ===",
    "",
    "CRITICAL INSTRUCTIONS:",
    "1. You MUST consider the above conversation history when responding",
    "2. If the user asks about something mentioned earlier, refer to it",
    "3. Maintain consistency with your previous responses",
    "4. If asked about previous messages, reference them accurately",
    "5. Remember any names, preferences, or facts shared by the user",
    ""
  );

  return contextLines.join('\n');
}

export function validateAndTruncateHistory(
  conversationHistory: ConversationMessage[] | undefined,
  maxCharacters: number = 100000
): ConversationMessage[] {
  if (!conversationHistory || !Array.isArray(conversationHistory)) {
    return [];
  }

  let totalChars = 0;
  const truncatedHistory: ConversationMessage[] = [];

  // Process history in reverse (keep most recent messages)
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const msg = conversationHistory[i];
    const msgChars = msg.content.length;

    if (totalChars + msgChars > maxCharacters) {
      // Add a truncation notice at the beginning
      truncatedHistory.unshift({
        role: 'system',
        content: '[Earlier conversation history was truncated due to length]'
      });
      break;
    }

    totalChars += msgChars;
    truncatedHistory.unshift(msg);
  }

  return truncatedHistory;
}

export function buildEnhancedInstructions(
  baseInstructions: string | undefined,
  conversationHistory: ConversationMessage[]
): string {
  const historyContext = formatConversationHistory(conversationHistory);
  const instructions = baseInstructions || 'You are a helpful AI assistant.';

  if (!historyContext) {
    return instructions;
  }

  return `${historyContext}\n\nSystem Instructions: ${instructions}`;
}