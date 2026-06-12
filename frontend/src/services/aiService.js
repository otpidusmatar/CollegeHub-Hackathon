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

/**
 * Analyze student competitiveness for a specific college
 * @param {Object} profile - Student's academic profile
 * @param {Object} college - College data
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeCompetitiveness(profile, college) {
  if (!aiService.isConfigured()) {
    throw new Error('AI service is not configured. Please add API keys to your .env file.');
  }

  // Build comprehensive profile summary
  const profileSummary = `
Student Academic Profile:
- GPA: ${profile.gpa || 'Not provided'} (Scale: ${profile.gpaScale || '4.0'})
- Class Rank: ${profile.classRank || 'Not provided'} out of ${profile.classSize || 'Not provided'}
- SAT Score: ${profile.satScore || 'Not provided'} (Math: ${profile.satMath || 'N/A'}, Reading: ${profile.satReading || 'N/A'})
- ACT Score: ${profile.actScore || 'Not provided'}
- Intended Major: ${profile.intendedMajor || 'Undecided'}

Advanced Courses:
- AP Courses: ${profile.apCourses?.length || 0} (${profile.apCourses?.map(c => c.name).join(', ') || 'None'})
- Honors Courses: ${profile.honorsCourses?.length || 0} (${profile.honorsCourses?.map(c => c.name).join(', ') || 'None'})
- IB Courses: ${profile.ibCourses?.length || 0} (${profile.ibCourses?.map(c => c.name).join(', ') || 'None'})

Achievements & Honors:
${profile.achievements?.length > 0 ? profile.achievements.map(a => `- ${a.title}: ${a.description || ''}`).join('\n') : '- None listed'}

Extracurricular Activities:
${profile.extracurriculars?.length > 0 ? profile.extracurriculars.map(e => `- ${e.name} (${e.role || 'Member'})`).join('\n') : '- None listed'}

Leadership Positions:
${profile.leadership?.length > 0 ? profile.leadership.map(l => `- ${l.name}: ${l.role || ''}`).join('\n') : '- None listed'}

Volunteering & Community Service:
${profile.volunteering?.length > 0 ? profile.volunteering.map(v => `- ${v.name} (${v.years || 0} hours)`).join('\n') : '- None listed'}
`;

  const collegeInfo = `
College Information:
- Name: ${college['school.name']}
- Location: ${college['school.city']}, ${college['school.state']}
- Acceptance Rate: ${college['latest.admissions.admission_rate.overall'] ? (college['latest.admissions.admission_rate.overall'] * 100).toFixed(1) + '%' : 'Not available'}
- Student Size: ${college['latest.student.size'] ? college['latest.student.size'].toLocaleString() : 'Not available'}
- In-State Tuition: ${college['latest.cost.tuition.in_state'] ? '$' + college['latest.cost.tuition.in_state'].toLocaleString() : 'Not available'}
- SAT Average: ${college['latest.admissions.sat_scores.average.overall'] || 'Not available'}
- ACT Median: ${college['latest.admissions.act_scores.midpoint.cumulative'] || 'Not available'}
`;

  const prompt = `You are a college admissions expert. Analyze this student's competitiveness for admission to the specified college.

${profileSummary}

${collegeInfo}

Provide a detailed analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "competitivenessScore": <number 0-100>,
  "collegeName": "<college name>",
  "location": "<city, state>",
  "acceptanceRate": <number>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "summary": "<2-3 sentence overall assessment>"
}

Consider:
1. How the student's GPA, test scores, and class rank compare to the college's typical admitted student profile
2. The rigor of coursework (AP, Honors, IB)
3. Quality and depth of extracurricular activities and leadership
4. Achievements and honors
5. The college's acceptance rate and selectivity
6. Alignment between student's intended major and college's strengths

The competitivenessScore should reflect:
- 80-100: Strong candidate, stats well above average for this college
- 60-79: Competitive candidate, stats align with typical admitted students
- 40-59: Reach school, stats below average but still possible
- 0-39: High reach, significant gap between student and typical admits`;

  try {
    const response = await aiService.generateContent(prompt, {
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 2048
    });

    // Parse JSON response with robust error handling
    let analysis;
    try {
      // Clean the response - remove markdown code blocks and extra whitespace
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to extract JSON if there's text before/after
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      console.error('Parse error:', parseError);
      
      // Provide a more helpful error message
      throw new Error('Failed to parse AI analysis. The AI response was not in the expected format. Please try again.');
    }

    // Validate and set defaults
    return {
      competitivenessScore: Math.min(100, Math.max(0, analysis.competitivenessScore || 50)),
      collegeName: analysis.collegeName || college['school.name'],
      location: analysis.location || `${college['school.city']}, ${college['school.state']}`,
      acceptanceRate: analysis.acceptanceRate || (college['latest.admissions.admission_rate.overall'] ? (college['latest.admissions.admission_rate.overall'] * 100).toFixed(1) : 'N/A'),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      summary: analysis.summary || 'Analysis completed. Review the detailed breakdown above.'
    };
  } catch (error) {
    console.error('Competitiveness analysis error:', error);
    throw new Error(error.message || 'Failed to analyze competitiveness. Please try again later.');
  }
}

// Made with Bob
