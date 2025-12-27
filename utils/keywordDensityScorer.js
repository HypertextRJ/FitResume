/**
 * Context-Aware Keyword Density Scorer
 * 
 * Philosophy: Context > Frequency
 * Prevent keyword stuffing from inflating scores
 * 
 * Rules:
 * 1. Keywords near action verbs = full credit
 * 2. Keywords in experience/projects = full credit
 * 3. Keywords ONLY in skills list = 50% credit
 * 4. Repeated beyond threshold = no extra credit
 * 5. Obvious stuffing patterns = penalty
 */

const ACTION_VERBS = [
    // Achievement verbs
    'achieved', 'accomplished', 'delivered', 'exceeded', 'completed',

    // Creation verbs
    'built', 'developed', 'created', 'designed', 'implemented', 'engineered',
    'architected', 'constructed', 'established', 'programmed', 'coded',

    // Leadership verbs
    'led', 'managed', 'directed', 'coordinated', 'supervised', 'mentored',
    'guided', 'trained', 'facilitated',

    // Improvement verbs
    'improved', 'enhanced', 'optimized', 'streamlined', 'automated',
    'refactored', 'modernized', 'upgraded', 'migrated',

    // Analysis verbs
    'analyzed', 'researched', 'investigated', 'evaluated', 'assessed',
    'diagnosed', 'tested', 'debugged',

    // Collaboration verbs
    'collaborated', 'partnered', 'worked', 'contributed', 'supported',
    'integrated', 'deployed', 'launched', 'maintained'
];

const EXPERIENCE_SECTION_HEADERS = [
    'experience', 'work experience', 'professional experience',
    'employment', 'work history', 'career', 'projects',
    'professional projects', 'key projects', 'achievements'
];

const SKILLS_SECTION_HEADERS = [
    'skills', 'technical skills', 'core competencies',
    'technologies', 'expertise', 'proficiencies', 'tools'
];

class KeywordDensityScorer {
    /**
     * Score keyword density with context awareness
     * 
     * @param {string} resumeText - Full resume text
     * @param {Array<string>} jdKeywords - Keywords from job description
     * @param {number} maxPoints - Maximum points (default 10)
     * @returns {Object} Scoring result
     */
    scoreKeywordDensity(resumeText, jdKeywords, maxPoints = 10) {
        if (!jdKeywords || jdKeywords.length === 0) {
            return {
                points: 0,
                maxPoints,
                density: 0,
                contextualMatches: 0,
                skillsOnlyMatches: 0,
                stuffingPenalty: 0,
                verdict: 'No keywords to match'
            };
        }

        // Extract resume sections
        const sections = this.extractSections(resumeText);

        // Analyze each keyword
        const keywordAnalysis = jdKeywords.map(keyword =>
            this.analyzeKeyword(keyword, resumeText, sections)
        );

        // Calculate credits
        let totalCredit = 0;
        let contextualMatches = 0;
        let skillsOnlyMatches = 0;

        keywordAnalysis.forEach(analysis => {
            if (analysis.contextualUses > 0) {
                // Has contextual usage - full credit
                totalCredit += 1.0;
                contextualMatches++;
            } else if (analysis.skillsListUses > 0) {
                // Only in skills list - 50% credit
                totalCredit += 0.5;
                skillsOnlyMatches++;
            }
            // No credit if keyword not found at all
        });

        // Calculate base density
        const baseDensity = totalCredit / jdKeywords.length;

        // Detect and penalize keyword stuffing
        const stuffingPenalty = this.detectStuffing(resumeText, jdKeywords);

        // Apply penalty
        const adjustedDensity = Math.max(0, baseDensity - stuffingPenalty);

        // Convert to points using strict mapping
        const points = this.densityToPoints(adjustedDensity, maxPoints);

        return {
            points: Math.round(points * 10) / 10, // 1 decimal
            maxPoints,
            density: Math.round(adjustedDensity * 100),
            baseDensity: Math.round(baseDensity * 100),
            contextualMatches,
            skillsOnlyMatches,
            totalMatches: contextualMatches + skillsOnlyMatches,
            totalKeywords: jdKeywords.length,
            stuffingPenalty: Math.round(stuffingPenalty * 100),
            verdict: this.getVerdict(adjustedDensity, stuffingPenalty),
            details: keywordAnalysis
        };
    }

    /**
     * Analyze a single keyword for context
     */
    analyzeKeyword(keyword, resumeText, sections) {
        const lowerKeyword = keyword.toLowerCase();
        const lowerText = resumeText.toLowerCase();

        // Count total occurrences
        const regex = new RegExp(`\\b${this.escapeRegex(lowerKeyword)}\\b`, 'gi');
        const allMatches = lowerText.match(regex) || [];
        const totalOccurrences = allMatches.length;

        // Check for contextual uses (near action verbs, in experience sections)
        let contextualUses = 0;
        let skillsListUses = 0;

        // Context 1: Near action verbs in experience sections
        if (sections.experience) {
            contextualUses += this.countContextualUses(
                lowerKeyword,
                sections.experience.toLowerCase()
            );
        }

        // Context 2: In skills list
        if (sections.skills) {
            const skillsMatches = sections.skills.toLowerCase().match(regex) || [];
            skillsListUses = skillsMatches.length;
        }

        // Excessive repetition flag
        const isExcessivelyRepeated = totalOccurrences > 5;

        return {
            keyword,
            totalOccurrences,
            contextualUses,
            skillsListUses,
            isExcessivelyRepeated,
            hasContext: contextualUses > 0
        };
    }

    /**
     * Count keyword uses near action verbs
     */
    countContextualUses(keyword, experienceText) {
        let count = 0;
        const sentences = experienceText.split(/[.!?]\s+/);

        sentences.forEach(sentence => {
            const hasKeyword = sentence.includes(keyword);
            const hasActionVerb = ACTION_VERBS.some(verb =>
                sentence.includes(verb.toLowerCase())
            );

            if (hasKeyword && hasActionVerb) {
                count++;
            }
        });

        // Cap at 3 - beyond that is likely stuffing
        return Math.min(count, 3);
    }

    /**
     * Detect keyword stuffing patterns
     * Returns penalty value (0.0 to 0.5)
     */
    detectStuffing(resumeText, keywords) {
        let penalty = 0;
        const lowerText = resumeText.toLowerCase();

        // Pattern 1: Same keyword repeated 6+ times
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${this.escapeRegex(keyword.toLowerCase())}\\b`, 'gi');
            const matches = lowerText.match(regex) || [];

            if (matches.length >= 6) {
                penalty += 0.1; // 10% penalty per excessively repeated keyword
            }
        });

        // Pattern 2: Keyword appears 3+ times in skills section only
        const skillsSection = this.extractSingleSection(resumeText, SKILLS_SECTION_HEADERS);
        if (skillsSection) {
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${this.escapeRegex(keyword.toLowerCase())}\\b`, 'gi');
                const skillsMatches = skillsSection.toLowerCase().match(regex) || [];
                const totalMatches = lowerText.match(regex) || [];

                // If 3+ occurrences and ALL in skills section
                if (skillsMatches.length >= 3 && skillsMatches.length === totalMatches.length) {
                    penalty += 0.05; // 5% penalty - suspicious
                }
            });
        }

        // Pattern 3: Comma-separated keyword list (obvious stuffing)
        const commaStuffPattern = keywords.join('.*,.*').toLowerCase();
        const hasCommaStuffing = new RegExp(commaStuffPattern, 'i').test(lowerText);
        if (hasCommaStuffing) {
            penalty += 0.15; // 15% penalty
        }

        // Cap penalty at 50%
        return Math.min(penalty, 0.5);
    }

    /**
     * Extract sections from resume
     */
    extractSections(resumeText) {
        return {
            experience: this.extractSingleSection(resumeText, EXPERIENCE_SECTION_HEADERS),
            skills: this.extractSingleSection(resumeText, SKILLS_SECTION_HEADERS)
        };
    }

    /**
     * Extract single section
     */
    extractSingleSection(text, headers) {
        const lowerText = text.toLowerCase();

        for (const header of headers) {
            const headerIndex = lowerText.indexOf(header.toLowerCase());
            if (headerIndex === -1) continue;

            // Find next section header or end
            const nextSectionHeaders = [...EXPERIENCE_SECTION_HEADERS, ...SKILLS_SECTION_HEADERS];
            let endIndex = text.length;

            for (const nextHeader of nextSectionHeaders) {
                if (nextHeader === header) continue; // Skip same header
                const nextIndex = lowerText.indexOf(nextHeader.toLowerCase(), headerIndex + header.length);
                if (nextIndex !== -1 && nextIndex < endIndex) {
                    endIndex = nextIndex;
                }
            }

            return text.substring(headerIndex, endIndex);
        }

        return null;
    }

    /**
     * Convert density to points with strict thresholds
     */
    densityToPoints(density, maxPoints) {
        // Thresholds (context-aware, so more generous than raw frequency)
        if (density >= 0.70) {
            return maxPoints; // 70%+ contextual = full points
        } else if (density >= 0.50) {
            return maxPoints * 0.7; // 50-70% = 70% of points
        } else if (density >= 0.30) {
            return maxPoints * 0.4; // 30-50% = 40% of points
        } else if (density >= 0.15) {
            return maxPoints * 0.2; // 15-30% = 20% of points
        } else {
            return 0; // < 15% = no points
        }
    }

    /**
     * Get verdict string
     */
    getVerdict(density, stuffingPenalty) {
        const penaltyText = stuffingPenalty > 0
            ? ` (${Math.round(stuffingPenalty * 100)}% stuffing penalty applied)`
            : '';

        if (density >= 0.70) {
            return `Excellent keyword alignment${penaltyText}`;
        } else if (density >= 0.50) {
            return `Good keyword presence${penaltyText}`;
        } else if (density >= 0.30) {
            return `Fair keyword match${penaltyText}`;
        } else if (density >= 0.15) {
            return `Poor keyword alignment${penaltyText}`;
        } else {
            return `Very poor keyword match${penaltyText}`;
        }
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = new KeywordDensityScorer();
