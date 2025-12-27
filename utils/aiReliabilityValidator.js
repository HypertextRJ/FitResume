/**
 * AI Reliability & Validation System
 * 
 * Philosophy: Never trust AI blindly
 * 
 * Responsibilities:
 * 1. Validate AI responses against schema
 * 2. Detect incomplete/hallucinated outputs
 * 3. Assign confidence scores
 * 4. Trigger fallbacks when needed
 * 5. Log failures for debugging
 * 
 * Rule: System MUST ALWAYS return a score, even if AI fails completely
 */

const fs = require('fs').promises;
const path = require('path');

class AIReliabilityValidator {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDir();
    }

    /**
     * Ensure log directory exists
     */
    async ensureLogDir() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (err) {
            console.error('Failed to create log directory:', err.message);
        }
    }

    /**
     * Validate JD Parser AI Response
     * 
     * Expected schema:
     * {
     *   requiredSkills: string[],
     *   preferredSkills: string[],
     *   requiredExperience: number,
     *   educationRequirement: string | null,
     *   responsibilities: string[],
     *   keywords: string[]
     * }
     */
    validateJDResponse(response, originalJD) {
        const issues = [];
        let confidence = 1.0; // Start with perfect confidence

        // Check 1: Has all required fields
        const requiredFields = [
            'requiredSkills',
            'preferredSkills',
            'requiredExperience',
            'educationRequirement',
            'keywords'
        ];

        requiredFields.forEach(field => {
            if (response[field] === undefined) {
                issues.push(`Missing field: ${field}`);
                confidence -= 0.2;
            }
        });

        // Check 2: Required skills should be an array
        if (!Array.isArray(response.requiredSkills)) {
            issues.push('requiredSkills is not an array');
            confidence -= 0.3;
        } else if (response.requiredSkills.length === 0) {
            // Empty required skills is suspicious
            issues.push('requiredSkills is empty (suspicious)');
            confidence -= 0.2;
        }

        // Check 3: Preferred skills should be an array
        if (!Array.isArray(response.preferredSkills)) {
            issues.push('preferredSkills is not an array');
            confidence -= 0.2;
        }

        // Check 4: Experience should be a number
        if (typeof response.requiredExperience !== 'number') {
            issues.push('requiredExperience is not a number');
            confidence -= 0.2;
        } else if (response.requiredExperience < 0 || response.requiredExperience > 30) {
            // Sanity check: 0-30 years is reasonable
            issues.push(`Unrealistic experience requirement: ${response.requiredExperience}`);
            confidence -= 0.3;
        }

        // Check 5: Keywords should be an array
        if (!Array.isArray(response.keywords)) {
            issues.push('keywords is not an array');
            confidence -= 0.1;
        } else if (response.keywords.length === 0) {
            // No keywords is suspicious
            issues.push('keywords array is empty');
            confidence -= 0.1;
        }

        // Check 6: Detect hallucination - skills should relate to JD
        if (response.requiredSkills && Array.isArray(response.requiredSkills)) {
            const hallucinatedSkills = this.detectHallucination(
                response.requiredSkills,
                originalJD
            );

            if (hallucinatedSkills.length > 0) {
                issues.push(`Possible hallucinated skills: ${hallucinatedSkills.join(', ')}`);
                confidence -= 0.1 * hallucinatedSkills.length;
            }
        }

        // Check 7: Completeness - should have reasonable amount of data
        const totalItems =
            (response.requiredSkills?.length || 0) +
            (response.preferredSkills?.length || 0) +
            (response.keywords?.length || 0);

        if (totalItems < 3) {
            issues.push('Response seems incomplete (very few items extracted)');
            confidence -= 0.2;
        }

        // Floor confidence at 0
        confidence = Math.max(0, confidence);

        return {
            isValid: confidence >= 0.5, // Consider valid if 50%+ confidence
            confidence,
            issues,
            shouldUseFallback: confidence < 0.5
        };
    }

    /**
     * Detect hallucinated skills
     * Skills that AI claims are in JD but actually aren't
     */
    detectHallucination(skills, originalText) {
        const hallucinated = [];
        const lowerText = originalText.toLowerCase();

        skills.forEach(skill => {
            const lowerSkill = skill.toLowerCase();

            // Check if skill appears in JD at all
            if (!lowerText.includes(lowerSkill)) {
                // Could be a variation, but mark as suspicious
                hallucinated.push(skill);
            }
        });

        // Only flag if more than 30% are not found (some variations are OK)
        return hallucinated.length > skills.length * 0.3 ? hallucinated : [];
    }

    /**
     * Validate Resume Parser AI Response
     * 
     * Expected: Well-structured resume data
     */
    validateResumeResponse(response) {
        const issues = [];
        let confidence = 1.0;

        // Check: Has basic structure
        if (!response.skills || !Array.isArray(response.skills)) {
            issues.push('Missing or invalid skills array');
            confidence -= 0.2;
        }

        if (!response.experience || !Array.isArray(response.experience)) {
            issues.push('Missing or invalid experience array');
            confidence -= 0.2;
        }

        // Check: Total experience is reasonable
        if (typeof response.totalYearsExperience !== 'number' ||
            response.totalYearsExperience < 0 ||
            response.totalYearsExperience > 50) {
            issues.push('Invalid totalYearsExperience');
            confidence -= 0.3;
        }

        confidence = Math.max(0, confidence);

        return {
            isValid: confidence >= 0.6, // Higher bar for resume parsing
            confidence,
            issues,
            shouldUseFallback: confidence < 0.6
        };
    }

    /**
     * Handle AI timeout
     */
    handleTimeout(operation, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const error = new Error(`AI timeout: ${operation} took longer than ${timeoutMs}ms`);
                error.code = 'AI_TIMEOUT';
                reject(error);
            }, timeoutMs);

            operation
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    /**
     * Log AI failure for debugging
     */
    async logFailure(context, error, input = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            context,
            error: {
                message: error.message,
                code: error.code,
                stack: error.stack
            },
            input: input ? {
                type: typeof input,
                length: input?.length,
                preview: input?.substring(0, 200) // Only first 200 chars
            } : null
        };

        // Console log
        console.error(`❌ AI Failure [${context}]:`, error.message);

        // Write to log file
        try {
            const logFile = path.join(
                this.logDir,
                `ai-failures-${timestamp.split('T')[0]}.log`
            );

            await fs.appendFile(
                logFile,
                JSON.stringify(logEntry, null, 2) + '\n---\n',
                'utf8'
            );
        } catch (err) {
            console.error('Failed to write AI failure log:', err.message);
        }

        return logEntry;
    }

    /**
     * Get confidence tier
     */
    getConfidenceTier(confidence) {
        if (confidence >= 0.9) return 'EXCELLENT';
        if (confidence >= 0.7) return 'GOOD';
        if (confidence >= 0.5) return 'ACCEPTABLE';
        if (confidence >= 0.3) return 'POOR';
        return 'UNRELIABLE';
    }

    /**
     * Comprehensive AI call wrapper with validation
     * 
     * @param {Function} aiOperation - Async function that calls AI
     * @param {Object} options - Configuration
     * @returns {Object} { success, data, confidence, usedFallback, issues }
     */
    async reliableAICall(aiOperation, options = {}) {
        const {
            context = 'AI Operation',
            validator = null,
            fallback = null,
            timeout = 30000, // 30 second default timeout
            retries = 1
        } = options;

        let lastError = null;
        let attempt = 0;

        while (attempt <= retries) {
            attempt++;

            try {
                // Attempt AI call with timeout
                console.log(`🤖 ${context} (attempt ${attempt}/${retries + 1})`);

                const result = await this.handleTimeout(
                    aiOperation(),
                    timeout
                );

                // Validate if validator provided
                if (validator) {
                    const validation = validator(result);

                    console.log(
                        `   Confidence: ${Math.round(validation.confidence * 100)}% ` +
                        `(${this.getConfidenceTier(validation.confidence)})`
                    );

                    if (validation.issues.length > 0) {
                        console.warn(`   Issues: ${validation.issues.join(', ')}`);
                    }

                    if (validation.shouldUseFallback && fallback) {
                        console.log(`   ⚠️  Low confidence, using fallback`);
                        const fallbackResult = await fallback();

                        return {
                            success: true,
                            data: fallbackResult,
                            confidence: 0.5, // Fallback gets medium confidence
                            usedFallback: true,
                            issues: validation.issues,
                            tier: 'ACCEPTABLE'
                        };
                    }

                    return {
                        success: true,
                        data: result,
                        confidence: validation.confidence,
                        usedFallback: false,
                        issues: validation.issues,
                        tier: this.getConfidenceTier(validation.confidence)
                    };
                }

                // No validator - assume success
                return {
                    success: true,
                    data: result,
                    confidence: 0.8, // Assume good if no validator
                    usedFallback: false,
                    issues: [],
                    tier: 'GOOD'
                };

            } catch (error) {
                lastError = error;
                console.error(`   ❌ Attempt ${attempt} failed:`, error.message);

                // Log failure
                await this.logFailure(context, error);

                // If retries exhausted, use fallback
                if (attempt > retries) {
                    if (fallback) {
                        console.log(`   🔄 All attempts failed, using fallback`);
                        const fallbackResult = await fallback();

                        return {
                            success: false,
                            data: fallbackResult,
                            confidence: 0.3, // Fallback after failure = low confidence
                            usedFallback: true,
                            error: error.message,
                            tier: 'POOR'
                        };
                    }

                    // No fallback available - throw
                    throw error;
                }

                // Wait before retry (exponential backoff)
                await this.sleep(1000 * attempt);
            }
        }

        // Should never reach here, but just in case
        throw lastError;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get AI reliability stats
     */
    async getStats() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files.filter(f => f.startsWith('ai-failures-'));

            return {
                totalFailureLogs: logFiles.length,
                logFiles,
                logDirectory: this.logDir
            };
        } catch (err) {
            return {
                totalFailureLogs: 0,
                error: err.message
            };
        }
    }
}

module.exports = new AIReliabilityValidator();
