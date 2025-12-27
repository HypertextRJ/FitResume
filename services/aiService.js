const OpenAI = require('openai');

/**
 * AI Service
 * Handles AI API calls with Gemini (primary) and OpenAI (fallback)
 * Gemini uses direct v1beta HTTP calls for compatibility
 */

class AIService {
    constructor() {
        this.provider = process.env.AI_PROVIDER || 'gemini';
        this.geminiClient = null;
        this.geminiModel = null; // Added to store the pre-initialized Gemini model
        this.openaiClient = null;

        this.initializeClients(); // Renamed from initialize
    }

    /**
     * Initialize AI clients
     */
    initializeClients() { // Renamed from initialize
        // Check Gemini API key (we'll use direct HTTP calls)
        if (process.env.GEMINI_API_KEY) {
            this.geminiClient = true; // Just a flag to indicate it's configured
            console.log('✅ Gemini AI initialized (v1beta/gemini-2.0-flash-exp)');
        }

        // Initialize OpenAI
        if (process.env.OPENAI_API_KEY) {
            try {
                this.openaiClient = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                });
                console.log('✅ OpenAI initialized');
            } catch (error) {
                console.error('Failed to initialize OpenAI:', error.message);
            }
        }

        // Verify at least one is available
        if (!this.geminiClient && !this.openaiClient) {
            console.warn('⚠️  No AI providers available. Please configure API keys in .env');
        }
    }

    /**
     * Main AI call method - routes to appropriate provider
     * @param {string} prompt - The prompt to send to AI
     * @param {Object} options - Additional options
     * @returns {Promise<string>} AI response text
     */
    async callAI(prompt, options = {}) {
        const provider = options.provider || this.provider;

        try {
            if (provider === 'gemini' && this.geminiClient) {
                return await this.callGemini(prompt, options);
            } else if (provider === 'openai' && this.openaiClient) {
                return await this.callOpenAI(prompt, options);
            } else {
                // Try fallback
                if (this.geminiClient) {
                    console.log('🔄 Falling back to Gemini');
                    return await this.callGemini(prompt, options);
                } else if (this.openaiClient) {
                    console.log('🔄 Falling back to OpenAI');
                    return await this.callOpenAI(prompt, options);
                } else {
                    throw new Error('No AI providers available');
                }
            }
        } catch (error) {
            console.error(`AI call failed (${provider}):`, error.message);

            // Try the other provider as fallback
            if (provider === 'gemini' && this.openaiClient) {
                console.log('🔄 Gemini failed, trying OpenAI...');
                return await this.callOpenAI(prompt, options);
            } else if (provider === 'openai' && this.geminiClient) {
                console.log('🔄 OpenAI failed, trying Gemini...');
                return await this.callGemini(prompt, options);
            }

            throw error;
        }
    }

    /**
     * Call Gemini API using direct HTTP (v1beta endpoint)
     */
    async callGemini(prompt, options = {}) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured');
        }

        try {
            // Use v1beta endpoint with gemini-2.0-flash-exp model
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.3,
                        maxOutputTokens: options.maxTokens || 2000
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Extract text from response
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const parts = data.candidates[0].content.parts;
                return parts.map(part => part.text).join('');
            }

            throw new Error('Invalid response format from Gemini');
        } catch (error) {
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(prompt, options = {}) {
        if (!this.openaiClient) {
            throw new Error('OpenAI client not initialized');
        }

        try {
            const completion = await this.openaiClient.chat.completions.create({
                model: options.model || 'gpt-3.5-turbo',  // Fixed: gpt-5 doesn't exist
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert HR analyst and ATS system. Provide accurate, structured responses.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 2000
            });

            return completion.choices[0].message.content;
        } catch (error) {
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }

    /**
     * Check if AI service is available
     */
    isAvailable() {
        return !!(this.geminiClient || this.openaiClient);
    }

    /**
     * Get current provider name
     */
    getCurrentProvider() {
        if (this.provider === 'gemini' && this.geminiClient) return 'Gemini';
        if (this.provider === 'openai' && this.openaiClient) return 'OpenAI';
        if (this.geminiClient) return 'Gemini (fallback)';
        if (this.openaiClient) return 'OpenAI (fallback)';
        return 'None';
    }
}

module.exports = new AIService();
