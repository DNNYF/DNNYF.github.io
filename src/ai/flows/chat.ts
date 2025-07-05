// D:\AI\llm-studio\src\ai\flows\chat.ts
'use server';

import { z } from 'zod';
import { llmConfigSchema } from '@/lib/schemas';
import type { Message } from '@/types';

const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  message: z.string(),
  config: llmConfigSchema.optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

interface APIResponse {
  choices: Array<{
    message?: {
      content: string;
    };
    text?: string;
  }>;
  error?: {
    message: string;
    type: string;
  };
}

function formatMessages(history: Message[], newMessage: string, systemPrompt?: string): any[] {
  const messages: any[] = [];
  
  // Add system message if provided
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }
  
  // Add conversation history
  history.forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });
  
  // Add new user message
  messages.push({
    role: "user",
    content: newMessage
  });
  
  return messages;
}

async function makeAPIRequest(apiUrl: string, requestBody: any, attempt: number = 1): Promise<APIResponse> {
  console.log(`API Request Attempt ${attempt}:`, {
    url: apiUrl,
    body: JSON.stringify(requestBody, null, 2)
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LLM-Studio/1.0',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // If error text is not JSON, use it as is
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`API Response Attempt ${attempt}:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - API took too long to respond');
    }
    
    throw error;
  }
}

export async function chat({ history, message, config }: ChatInput): Promise<ChatOutput> {
  const apiUrl = process.env.HEROKU_API_URL;

  if (!apiUrl) {
    throw new Error("HEROKU_API_URL is not configured. Please set this environment variable.");
  }

  // Validate message
  if (!message.trim()) {
    throw new Error("Message cannot be empty");
  }

  // Format messages for OpenAI-compatible API
  const messages = formatMessages(history, message, config?.system_prompt);

  const requestBody = {
    model: "gema-4b",
    messages: messages,
    max_tokens: Math.min(config?.max_tokens || 500, 4096), // Ensure reasonable limits
    temperature: Math.max(0, Math.min(config?.temperature || 0.7, 2)), // Clamp between 0-2
    top_k: Math.max(1, Math.min(config?.top_k || 40, 100)), // Clamp between 1-100
    top_p: Math.max(0, Math.min(config?.top_p || 0.95, 1)), // Clamp between 0-1
    repeat_penalty: Math.max(1, Math.min(config?.repeat_penalty || 1.1, 2)), // Clamp between 1-2
    stream: false,
    // Add stop sequences if provided
    ...(config?.stop && config.stop.length > 0 ? { stop: config.stop } : {}),
  };

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await makeAPIRequest(apiUrl, requestBody, attempt);

      // Handle API error responses
      if (data.error) {
        throw new Error(`API Error: ${data.error.message}`);
      }

      // Extract response content
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        const resultText = choice.message?.content || choice.text;
        
        if (typeof resultText !== 'string') {
          console.error("Unexpected API response format:", data);
          throw new Error("API returned invalid response format");
        }

        const trimmedResult = resultText.trim();
        
        if (!trimmedResult) {
          throw new Error("API returned empty response");
        }

        console.log(`Chat successful on attempt ${attempt}`);
        return trimmedResult;
      } else {
        throw new Error("API response missing choices array");
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`API request failed on attempt ${attempt}:`, lastError.message);

      // Don't retry on certain errors
      if (
        lastError.message.includes('401') || 
        lastError.message.includes('403') ||
        lastError.message.includes('API key') ||
        lastError.message.includes('unauthorized')
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all retries failed
  console.error("All API attempts failed. Last error:", lastError?.message);

  // Return a user-friendly error message
  if (lastError?.message.includes('timeout')) {
    return "⚠️ The AI service is taking too long to respond. Please try again in a moment.";
  } else if (lastError?.message.includes('500') || lastError?.message.includes('502') || lastError?.message.includes('503')) {
    return "⚠️ The AI service is temporarily unavailable. Please try again later.";
  } else if (lastError?.message.includes('network') || lastError?.message.includes('fetch')) {
    return "⚠️ Network connection issue. Please check your connection and try again.";
  } else {
    return `⚠️ AI service error: ${lastError?.message || 'Unknown error occurred'}`;
  }
}

// Helper function to test the API connection
export async function testAPIConnection(config?: any): Promise<{ success: boolean; message: string }> {
  try {
    const testResult = await chat({
      history: [],
      message: "Hello, are you working?",
      config: config
    });

    if (testResult.startsWith('⚠️')) {
      return { success: false, message: testResult };
    }

    return { success: true, message: "API connection successful!" };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
