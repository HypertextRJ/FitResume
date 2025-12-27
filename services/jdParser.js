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
You are an EXPERT ATS Job Description Analyzer. Your job is to ALWAYS extract structured data from ANY job description, even if information is implicit or scattered.

CRITICAL REQUIREMENTS:
- You MUST extract at least 3-5 required skills from EVERY job description
- If skills aren't explicitly listed, INFER them from responsibilities and job title
- Even vague job descriptions have extractable requirements

--------------------------------------------------
EXTRACTION RULES (MANDATORY)
--------------------------------------------------

1. **Required Skills** - ALWAYS extract (minimum 3-5 skills):
   - Look for explicit mentions: "must have", "required", "essential"
   - If not explicit, INFER from:
     * Job title (e.g., "Software Engineer" → Java, Python, or similar)
     * Responsibilities (e.g., "manage databases" → SQL, Database Management)
     * Technologies mentioned anywhere in the description
   - Extract CORE skill names (prefer shorter/common forms):
     * "Java Development" → "Java"
     * "Object-Oriented Programming" → "OOP"
     * "Database Management Systems" → "DBMS"

2. **Preferred Skills** - Extract if mentioned:
   - "Nice to have", "preferred", "bonus", "plus"
   - Technologies mentioned without "required" emphasis

3. **Experience** - Extract years:
   - Look for: "X years", "X+ years", "minimum X years"
   - If range given (e.g., "3-5 years"), use minimum number
   - If not specified: return 0

4. **Education** - Extract degree requirement:
   - Bachelor's, Master's, PhD, etc.
   - If not specified: return null

5. **Keywords** - Extract 10-15 relevant terms:
   - Domain terms (e.g., "backend", "frontend", "agile", "cloud")
   - Industry terms
   - Process/methodology terms

6. **Responsibilities** - Extract 3-5 key duties:
   - Main tasks the role involves

--------------------------------------------------
COMMON ABBREVIATIONS TO RECOGNIZE
--------------------------------------------------
- Technical: OOP, DBMS, RDBMS, HTML, CSS, SQL, API, REST, JSON, XML, UI, UX
- Cloud: AWS, GCP, Azure, S3, EC2, Lambda
- Processes: CI/CD, ML, AI, DevOps, Agile, Scrum
- Languages: JS (JavaScript), TS (TypeScript), Py (Python)
- Frameworks: React, Angular, Vue, Django, Flask, Spring

--------------------------------------------------
JOB DESCRIPTION TO ANALYZE
--------------------------------------------------
${jd}

--------------------------------------------------
OUTPUT FORMAT (STRICT JSON ONLY)
--------------------------------------------------
Return ONLY valid JSON (no markdown, no extra text, no explanation):

{
  "requiredSkills": ["Skill1", "Skill2", "Skill3", "..."],
  "preferredSkills": ["Skill1", "Skill2", "..."],
  "requiredExperience": 0,
  "educationRequirement": "Degree or null",
  "responsibilities": ["Task1", "Task2", "Task3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "..."]
}

EXAMPLES:

Example 1 - Clear JD:
Job Description: "We need a Senior Java Developer with 5+ years experience. Must have Java, Spring Boot, MySQL. Nice to have AWS, Docker."

Output:
{
  "requiredSkills": ["Java", "Spring Boot", "MySQL"],
  "preferredSkills": ["AWS", "Docker"],
  "requiredExperience": 5,
  "educationRequirement": null,
  "responsibilities": ["Develop backend services", "Write maintainable code"],
  "keywords": ["backend", "senior", "developer", "cloud"]
}

Example 2 - Vague JD (IMPORTANT!):
Job Description: "Looking for a marketing professional to manage our social media and create content."

Output:
{
  "requiredSkills": ["Marketing", "Social Media", "Content Creation", "Digital Marketing", "SEO"],
  "preferredSkills": ["Analytics", "Paid Advertising"],
  "requiredExperience": 0,
  "educationRequirement": null,
  "responsibilities": ["Manage social media", "Create content", "Build brand awareness"],
  "keywords": ["marketing", "social", "content", "digital", "branding"]
}

CRITICAL REMINDERS:
✓ ALWAYS extract at least 3-5 required skills (infer if needed!)
✓ Use short/common skill names
✓ Recognize abbreviations
✓ Return ONLY valid JSON
✓ Do NOT skip fields - return empty arrays [] or null if truly nothing found`
            ;
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
