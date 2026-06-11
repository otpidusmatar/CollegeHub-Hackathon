import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * AI Service with automatic fallback from Gemini to Groq
 * Handles rate limiting and API errors gracefully
 */

class AIService {
  constructor() {
    // Initialize Gemini
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.geminiClient = this.geminiApiKey ? new GoogleGenerativeAI(this.geminiApiKey) : null;
    
    // Initialize Groq
    this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    this.groqClient = this.groqApiKey ? new Groq({ 
      apiKey: this.groqApiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    }) : null;
    
    // Track which service is currently being used
    this.currentProvider = 'gemini';
    this.fallbackAttempted = false;
  }

  /**
   * Check if API keys are configured
   */
  isConfigured() {
    return this.geminiApiKey || this.groqApiKey;
  }

  /**
   * Get the current provider name
   */
  getCurrentProvider() {
    return this.currentProvider;
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimitError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorStatus = error?.status || error?.statusCode || 0;
    
    return (
      errorStatus === 429 ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('resource_exhausted')
    );
  }

  /**
   * Generate content with automatic fallback
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The generated text
   */
  async generateContent(prompt, options = {}) {
    const { model = 'default', temperature = 0.7, maxTokens = 2048 } = options;

    // Try Gemini first
    if (this.geminiClient && this.currentProvider === 'gemini') {
      try {
        const geminiModel = model === 'lite' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
        const modelInstance = this.geminiClient.getGenerativeModel({ 
          model: geminiModel,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          }
        });
        
        const result = await modelInstance.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error('Gemini API error:', error);
        
        // If rate limited, switch to Groq
        if (this.isRateLimitError(error) && this.groqClient && !this.fallbackAttempted) {
          console.warn('Gemini rate limited, switching to Groq...');
          this.currentProvider = 'groq';
          this.fallbackAttempted = true;
          return this.generateContent(prompt, options);
        }
        
        throw error;
      }
    }

    // Use Groq as fallback or primary if Gemini is not available
    if (this.groqClient) {
      try {
        // Map model types to Groq models
        const groqModel = model === 'lite' 
          ? 'llama-3.3-70b-versatile'  // Fast model
          : 'llama-3.3-70b-versatile'; // Default model
        
        const completion = await this.groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: groqModel,
          temperature,
          max_tokens: maxTokens,
        });
        
        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Groq API error:', error);
        throw error;
      }
    }

    throw new Error('No AI service is configured. Please add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.');
  }

  /**
   * Start a chat session with context
   * @param {Array} history - Chat history
   * @param {string} message - New message to send
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The response text
   */
  async chat(history, message, options = {}) {
    const { temperature = 0.7, maxTokens = 2048 } = options;

    // Try Gemini first
    if (this.geminiClient && this.currentProvider === 'gemini') {
      try {
        const model = this.geminiClient.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          }
        });
        
        // Convert history to Gemini format
        const geminiHistory = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
        
        // Remove leading model messages
        while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
          geminiHistory.shift();
        }
        
        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error('Gemini chat error:', error);
        
        // If rate limited, switch to Groq
        if (this.isRateLimitError(error) && this.groqClient && !this.fallbackAttempted) {
          console.warn('Gemini rate limited, switching to Groq...');
          this.currentProvider = 'groq';
          this.fallbackAttempted = true;
          return this.chat(history, message, options);
        }
        
        throw error;
      }
    }

    // Use Groq as fallback
    if (this.groqClient) {
      try {
        // Convert history to Groq format and add new message
        const groqMessages = [
          ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          { role: 'user', content: message }
        ];
        
        const completion = await this.groqClient.chat.completions.create({
          messages: groqMessages,
          model: 'llama-3.3-70b-versatile',
          temperature,
          max_tokens: maxTokens,
        });
        
        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Groq chat error:', error);
        throw error;
      }
    }

    throw new Error('No AI service is configured. Please add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.');
  }

  /**
   * Reset to try Gemini again (useful after rate limit period)
   */
  resetToGemini() {
    if (this.geminiClient) {
      this.currentProvider = 'gemini';
      this.fallbackAttempted = false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

// Made with Bob
