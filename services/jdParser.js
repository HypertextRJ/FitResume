const aiService = require('./aiService');
const fallbackParser = require('../utils/fallbackJDParser');

/**
 * Job Description Parser Service
 * Uses AI with FAIL-SAFE fallback for robust parsing
 * 
 * Strategy:
 * 1. AI extraction (primary)
 * 2. Validate AI results for completeness
 * 3. Use deterministic fallback if AI weak/fails
 * 4. Merge AI + fallback results intelligently
 */

class JDParser {
    /**
     * Parse job description and extract requirements
     * @param {string} jobDescription - Raw job description text
     * @returns {Promise<Object>} Structured JD data
     */
    async parseJobDescription(jobDescription) {
        let aiResults = null;
        let usedFallback = false;

        // Try AI extraction
        try {
            const prompt = this.buildExtractionPrompt(jobDescription);
            const aiResponse = await aiService.callAI(prompt);
            aiResults = this.parseAIResponse(aiResponse);

            // Validate AI results quality
            const isComplete = this.validateAIResults(aiResults);

            if (!isComplete) {
                console.log('⚠️  AI results incomplete, using fallback to supplement');
                usedFallback = true;
            }

        } catch (error) {
            console.error('AI parsing failed:', error.message);
            console.log('🔄 Switching to deterministic fallback parser');
            usedFallback = true;
        }

        // Get fallback results
        const fallbackResults = fallbackParser.parse(jobDescription);

        // Merge results intelligently
        let finalResults;
        if (aiResults && !usedFallback) {
            // AI succeeded and is complete - use it, but supplement with fallback
            finalResults = fallbackParser.mergeWithAI(aiResults, fallbackResults);
        } else if (aiResults && usedFallback) {
            // AI partial - merge with fallback
            finalResults = fallbackParser.mergeWithAI(aiResults, fallbackResults);
        } else {
            // AI totally failed - use fallback only
            finalResults = {
                requiredSkills: fallbackResults.requiredSkills,
                preferredSkills: fallbackResults.preferredSkills,
                requiredExperience: fallbackResults.experienceYears,
                educationRequirement: fallbackResults.education,
                keywords: fallbackResults.keywords,
                responsibilities: []
            };
        }

        return {
            original: jobDescription,
            ...finalResults,
            _meta: {
                usedAI: !!aiResults,
                usedFallback: usedFallback,
                confidence: aiResults ? 'high' : 'fallback-only'
            }
        };
    }

    /**
     * Build AI prompt for JD extraction
     * Emphasizes skill equivalence and meaning over wording
     */
    buildExtractionPrompt(jd) {
        return `SYSTEM ROLE
-----------
You are a STRICT but FAIR ATS-style Job Description Analyzer.

You must extract requirements intelligently, understanding that:
- Skills can be expressed as abbreviations (OOP, DBMS, HTML, CSS, SQL)
- Competencies have equivalent forms ("Java" = "Java Development")  
- Wording varies between job descriptions

--------------------------------------------------
CORE PRINCIPLE (NON-NEGOTIABLE)
--------------------------------------------------
Extract requirements by MEANING, not exact wording.

Understand equivalence:
- Abbreviation ⇄ Full form
  ("OOP" ⇄ "Object-Oriented Programming")
  
- Skill ⇄ Skill-in-context
  ("Java" ⇄ "Java Development")
  
- Task ⇄ Responsibility
  ("Hiring" ⇄ "Talent Acquisition")

--------------------------------------------------
EXTRACTION RULES
--------------------------------------------------
1. Extract CORE skill names (prefer shorter/common form)
   - "Java Development" → Extract as "Java"
   - "Object-Oriented Programming" → Extract as "OOP"
   - "Database Management Systems" → Extract as "DBMS"

2. Avoid over-expansion
   - Extract "Python" not "Python Programming Skills"
   - Extract "React" not "React.js Framework Development"

3. Recognize common abbreviations:
   - Technical: OOP, DBMS, RDBMS, HTML, CSS, SQL, API, REST, JSON, XML
   - Cloud: AWS, GCP, Azure
   - Processes: CI/CD, ML, AI, DevOps

4. Distinguish required vs preferred:
   - "Must have" / "Required" / "Essential" → requiredSkills
   - "Nice to have" / "Preferred" / "Bonus" → preferredSkills
   - If unclear, default to requiredSkills

--------------------------------------------------
EXTRACTION TASK
--------------------------------------------------
Analyze this job description and extract:

1. requiredSkills: Essential skills (use core names, recognize abbreviations)
2. preferredSkills: Nice-to-have skills
3. requiredExperience: Minimum years (number, 0 if not specified)
4. educationRequirement: Minimum degree (string or null)
5. responsibilities: Key job duties
6. keywords: Important domain/industry terms

JOB DESCRIPTION:
${jd}

--------------------------------------------------
OUTPUT FORMAT (STRICT JSON ONLY)
--------------------------------------------------
Return ONLY valid JSON (no markdown, no extra text):

{
  "requiredSkills": ["Java", "OOP", "Spring Boot", "MySQL"],
  "preferredSkills": ["AWS", "Docker"],
  "requiredExperience": 3,
  "educationRequirement": "Bachelor's degree in Computer Science",
  "responsibilities": ["Design backend services", "Write maintainable code"],
  "keywords": ["backend", "microservices", "agile"]
}

CRITICAL:
- Use core skill names (short forms when common)
- Recognize abbreviations automatically
- Extract by meaning, not exact wording
- Return ONLY valid JSON`;
    }

    /**
     * Parse AI response into structured data
     */
    parseAIResponse(response) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate and normalize structure
            return {
                requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
                preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
                requiredExperience: typeof parsed.requiredExperience === 'number' ? parsed.requiredExperience :
                    (parseInt(parsed.requiredExperience) || 0),
                educationRequirement: parsed.educationRequirement || null,
                responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            throw error;
        }
    }

    /**
     * Validate AI results for completeness
     * Returns true if results are complete and high-quality
     */
    validateAIResults(aiResults) {
        if (!aiResults) return false;

        // Check if critical fields are populated
        const hasRequiredSkills = aiResults.requiredSkills && aiResults.requiredSkills.length > 0;
        const hasExperience = typeof aiResults.requiredExperience === 'number';

        // At minimum, we need skills or experience to consider it valid
        const isMinimallyValid = hasRequiredSkills || hasExperience;

        // Check for quality indicators
        const hasPreferredSkills = aiResults.preferredSkills && aiResults.preferredSkills.length > 0;
        const hasKeywords = aiResults.keywords && aiResults.keywords.length > 0;

        // High quality = has required skills AND at least one other field
        const isHighQuality = hasRequiredSkills && (hasPreferredSkills || hasKeywords || aiResults.educationRequirement);

        return isHighQuality;
    }
}

module.exports = new JDParser();
