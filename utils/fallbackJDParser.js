/**
 * FAIL-SAFE Fallback Job Description Parser
 * Deterministic, rule-based extraction when AI fails or is incomplete
 * 
 * Philosophy: Conservative extraction - better to miss than guess wrong
 */

class FallbackJDParser {
    constructor() {
        // Comprehensive skill/technology patterns
        this.techKeywords = [
            // Programming Languages
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'golang',
            'ruby', 'php', 'swift', 'kotlin', 'rust', 'scala', 'r', 'matlab',

            // Frontend
            'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs', 'vue.js',
            'next.js', 'nextjs', 'svelte', 'html', 'css', 'sass', 'scss', 'tailwind',

            // Backend
            'node.js', 'nodejs', 'express', 'express.js', 'django', 'flask', 'fastapi',
            'spring', 'spring boot', '.net', 'asp.net', 'rails', 'laravel',

            // Databases
            'sql', 'nosql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis',
            'elasticsearch', 'cassandra', 'dynamodb', 'oracle', 'sqlite',

            // Cloud & DevOps
            'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
            'ci/cd', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible',

            // APIs & Architecture
            'rest', 'restful', 'rest api', 'graphql', 'grpc', 'microservices',
            'api design', 'soap', 'webhooks',

            // Tools & Frameworks
            'git', 'github', 'bitbucket', 'jira', 'confluence', 'slack',
            'webpack', 'babel', 'npm', 'yarn', 'maven', 'gradle',

            // Methodologies
            'agile', 'scrum', 'kanban', 'tdd', 'test driven development',
            'ci/cd', 'devops', 'unit testing', 'integration testing',

            // Data & ML
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
            'pandas', 'numpy', 'data analysis', 'big data', 'spark', 'hadoop',

            // Mobile
            'ios', 'android', 'react native', 'flutter', 'xamarin', 'mobile development'
        ];
    }

    /**
     * Main fallback parse method
     */
    parse(jobDescription) {
        const jd = jobDescription.toLowerCase();

        return {
            experienceYears: this.extractExperienceYears(jd),
            education: this.extractEducation(jd),
            requiredSkills: this.extractRequiredSkills(jd, jobDescription),
            preferredSkills: this.extractPreferredSkills(jd, jobDescription),
            keywords: this.extractKeywords(jd),
            confidence: 'fallback' // Marker that this is fallback parsing
        };
    }

    /**
     * Extract years of experience using multiple regex patterns
     */
    extractExperienceYears(jd) {
        const patterns = [
            // "5+ years", "5 + years", "5 plus years"
            /(\d+)\s*\+?\s*(?:plus)?\s*years?\s+(?:of\s+)?experience/i,

            // "minimum 5 years", "at least 5 years"
            /(?:minimum|at least|minimum of)\s+(\d+)\s+years?/i,

            // "3 to 5 years", "3-5 years"
            /(\d+)\s*(?:to|-)\s*(\d+)\s+years?/i,

            // "experience: 5 years", "required: 5 years"
            /(?:experience|required):\s*(\d+)\s+years?/i,

            // "5 year experience"
            /(\d+)\s+years?\s+experience/i
        ];

        for (const pattern of patterns) {
            const match = jd.match(pattern);
            if (match) {
                // If range (e.g., "3-5 years"), take the minimum
                const years = match[2] ? parseInt(match[1]) : parseInt(match[1]);

                // Sanity check: 0-30 years is reasonable
                if (years >= 0 && years <= 30) {
                    return years;
                }
            }
        }

        return 0; // No experience requirement found
    }

    /**
     * Extract education requirements
     */
    extractEducation(jd) {
        // Check in order of highest to lowest degree
        const degreePatterns = [
            {
                regex: /\b(?:ph\.?d\.?|doctorate|doctoral)\b/i,
                level: 'PhD'
            },
            {
                regex: /\b(?:master['']?s?|m\.?s\.?|m\.?a\.?|mba|m\.?tech|m\.?e\.?)\b/i,
                level: "Master's"
            },
            {
                regex: /\b(?:bachelor['']?s?|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?e\.?|undergraduate)\b/i,
                level: "Bachelor's"
            },
            {
                regex: /\b(?:associate['']?s?|a\.?s\.?|a\.?a\.?)\b/i,
                level: "Associate's"
            },
            {
                regex: /\b(?:diploma|certificate)\b/i,
                level: 'Diploma'
            }
        ];

        for (const { regex, level } of degreePatterns) {
            if (regex.test(jd)) {
                return level;
            }
        }

        return null; // No education requirement found
    }

    /**
     * Extract required skills (skills mentioned as "required", "must have", etc.)
     */
    extractRequiredSkills(jdLower, jdOriginal) {
        const requiredSkills = new Set();

        // Strategy 1: Find skills in "required" sections
        const requiredSections = this.extractSections(jdLower, [
            'required', 'requirements', 'must have', 'must-have',
            'essential', 'mandatory', 'qualifications'
        ]);

        requiredSections.forEach(section => {
            this.extractSkillsFromText(section).forEach(skill =>
                requiredSkills.add(skill)
            );
        });

        // Strategy 2: Skills mentioned multiple times (likely important)
        const allSkills = this.extractSkillsFromText(jdLower);
        allSkills.forEach(skill => {
            const count = (jdLower.match(new RegExp(this.escapeRegex(skill), 'g')) || []).length;
            if (count >= 2) {
                requiredSkills.add(skill);
            }
        });

        // Strategy 3: Skills explicitly marked as required
        this.techKeywords.forEach(keyword => {
            const requiredPattern = new RegExp(
                `${this.escapeRegex(keyword)}\\s+(?:is\\s+)?(?:required|mandatory|essential)`,
                'i'
            );
            if (requiredPattern.test(jdLower)) {
                requiredSkills.add(keyword);
            }
        });

        return Array.from(requiredSkills);
    }

    /**
     * Extract preferred/nice-to-have skills
     */
    extractPreferredSkills(jdLower, jdOriginal) {
        const preferredSkills = new Set();

        // Find skills in "preferred" sections
        const preferredSections = this.extractSections(jdLower, [
            'preferred', 'nice to have', 'nice-to-have', 'bonus',
            'plus', 'desirable', 'advantage', 'beneficial'
        ]);

        preferredSections.forEach(section => {
            this.extractSkillsFromText(section).forEach(skill =>
                preferredSkills.add(skill)
            );
        });

        // Skills explicitly marked as preferred
        this.techKeywords.forEach(keyword => {
            const preferredPattern = new RegExp(
                `${this.escapeRegex(keyword)}\\s+(?:is\\s+)?(?:preferred|nice|bonus|plus)`,
                'i'
            );
            if (preferredPattern.test(jdLower)) {
                preferredSkills.add(keyword);
            }
        });

        return Array.from(preferredSkills);
    }

    /**
     * Extract all skills/technologies mentioned
     */
    extractSkillsFromText(text) {
        const foundSkills = [];
        const lowerText = text.toLowerCase();

        this.techKeywords.forEach(keyword => {
            // Word boundary aware matching
            const pattern = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
            if (pattern.test(lowerText)) {
                foundSkills.push(keyword);
            }
        });

        return foundSkills;
    }

    /**
     * Extract section of text based on headers
     */
    extractSections(text, headers) {
        const sections = [];

        headers.forEach(header => {
            const headerPattern = new RegExp(
                `(?:^|\\n)\\s*(?:#+\\s*)?${this.escapeRegex(header)}[:\\s]*(.+?)(?=\\n\\s*(?:#+|[A-Z][a-z]+:)|$)`,
                'is'
            );

            const match = text.match(headerPattern);
            if (match && match[1]) {
                sections.push(match[1].trim());
            }
        });

        return sections;
    }

    /**
     * Extract general keywords for keyword density matching
     */
    extractKeywords(jd) {
        // Extract top frequently mentioned technical terms
        const words = jd.split(/\s+/);
        const freq = {};

        words.forEach(word => {
            const cleaned = word.replace(/[^\w]/g, '').toLowerCase();
            if (cleaned.length > 3 && !this.isStopWord(cleaned)) {
                freq[cleaned] = (freq[cleaned] || 0) + 1;
            }
        });

        // Return top 30 keywords by frequency
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([word]) => word);
    }

    /**
     * Check if word is a stop word
     */
    isStopWord(word) {
        const stopWords = new Set([
            'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have',
            'been', 'will', 'would', 'should', 'could', 'your', 'their',
            'about', 'into', 'through', 'during', 'before', 'after',
            'above', 'below', 'between', 'under', 'again', 'further',
            'then', 'once', 'here', 'there', 'when', 'where', 'what'
        ]);
        return stopWords.has(word);
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Merge fallback results with AI results
     * Strategy: AI takes precedence, fallback fills gaps
     */
    mergeWithAI(aiResults, fallbackResults) {
        return {
            requiredSkills: this.mergeArrays(
                aiResults.requiredSkills,
                fallbackResults.requiredSkills,
                'ai-preferred'
            ),
            preferredSkills: this.mergeArrays(
                aiResults.preferredSkills,
                fallbackResults.preferredSkills,
                'ai-preferred'
            ),
            requiredExperience: aiResults.requiredExperience || fallbackResults.experienceYears,
            educationRequirement: aiResults.educationRequirement || fallbackResults.education,
            keywords: this.mergeArrays(
                aiResults.keywords,
                fallbackResults.keywords,
                'combine'
            ),
            responsibilities: aiResults.responsibilities || []
        };
    }

    /**
     * Smart array merging
     */
    mergeArrays(aiArray, fallbackArray, strategy = 'ai-preferred') {
        if (!aiArray || aiArray.length === 0) {
            return fallbackArray || [];
        }

        if (!fallbackArray || fallbackArray.length === 0) {
            return aiArray || [];
        }

        if (strategy === 'ai-preferred') {
            // Use AI results, add fallback items only if missing
            const combined = new Set(aiArray.map(s => s.toLowerCase()));
            fallbackArray.forEach(item => {
                if (!combined.has(item.toLowerCase())) {
                    aiArray.push(item);
                }
            });
            return aiArray;
        } else if (strategy === 'combine') {
            // Combine both, remove duplicates
            const combined = new Set([
                ...aiArray.map(s => s.toLowerCase()),
                ...fallbackArray.map(s => s.toLowerCase())
            ]);
            return Array.from(combined);
        }

        return aiArray;
    }
}

module.exports = new FallbackJDParser();
