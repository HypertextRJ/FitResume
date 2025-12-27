/**
 * Text Analyzer Utilities
 * Helper functions for text processing, similarity, and keyword extraction
 */

class TextAnalyzer {
    /**
     * Calculate similarity between two strings using Jaccard similarity
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(str1, str2) {
        const tokens1 = this.tokenize(str1);
        const tokens2 = this.tokenize(str2);

        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Tokenize string into words
     */
    tokenize(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2);
    }

    /**
     * Extract keywords from text
     * @param {string} text - Input text
     * @param {number} topN - Number of top keywords to return
     * @returns {Array<string>} Top keywords
     */
    extractKeywords(text, topN = 20) {
        const tokens = this.tokenize(text);
        const stopWords = new Set([
            'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have',
            'has', 'been', 'will', 'can', 'may', 'should', 'would', 'could',
            'our', 'their', 'your', 'his', 'her', 'its', 'they', 'them',
            'what', 'which', 'who', 'when', 'where', 'why', 'how'
        ]);

        // Filter out stop words and count frequencies
        const freq = {};
        tokens.forEach(token => {
            if (!stopWords.has(token) && token.length > 3) {
                freq[token] = (freq[token] || 0) + 1;
            }
        });

        // Sort by frequency and return top N
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([word]) => word);
    }

    /**
     * Calculate keyword density (how many JD keywords appear in resume)
     * @param {Array<string>} resumeKeywords - Keywords from resume
     * @param {Array<string>} jdKeywords - Keywords from job description
     * @returns {number} Density score (0-1)
     */
    calculateKeywordDensity(resumeKeywords, jdKeywords) {
        if (!jdKeywords || jdKeywords.length === 0) {
            return 0;
        }

        const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
        const jdSet = new Set(jdKeywords.map(k => k.toLowerCase()));

        let matches = 0;
        jdSet.forEach(keyword => {
            if (resumeSet.has(keyword)) {
                matches++;
            }
        });

        return matches / jdSet.size;
    }

    /**
   * Check if skill is present in text using STRICT rule-based matching
   * @param {string} skill - Skill to search for
   * @param {string} text - Text to search in
   * @param {Array<string>} allSkillsInText - All skills found in text (optional, for similarity check)
   * @returns {Object} { found: boolean, confidence: number, matchedSkill: string }
   */
    findSkill(skill, text, allSkillsInText = null) {
        const skillSimilarity = require('../config/skillSimilarity');

        const normalizedSkill = skill.toLowerCase().trim();
        const normalizedText = text.toLowerCase();

        // 1. Exact match (100% confidence)
        if (normalizedText.includes(normalizedSkill)) {
            return { found: true, confidence: 1.0, matchedSkill: skill };
        }

        // 2. Check normalized variation (e.g., "react.js" vs "reactjs")
        const normalized = skillSimilarity.normalizeSkill(normalizedSkill);
        const pattern = new RegExp(`\\b${this.escapeRegex(normalized)}\\b`, 'i');
        if (pattern.test(normalizedText)) {
            return { found: true, confidence: 1.0, matchedSkill: skill };
        }

        // 3. If we have a list of skills, check for STRICT predefined similarity
        if (allSkillsInText && Array.isArray(allSkillsInText)) {
            const match = skillSimilarity.calculateSkillCredit(skill, allSkillsInText);

            if (match.credit > 0) {
                return {
                    found: true,
                    confidence: match.credit,  // Already capped at 50% for partials
                    matchedSkill: match.skill,
                    similarity: match.similarity,
                    explanation: match.explanation
                };
            }
        }

        // 4. No match found
        return { found: false, confidence: 0, matchedSkill: null };
    }

    /**
     * Helper to escape special characters in a string for use in a RegExp constructor.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    /**
     * DEPRECATED: Old fuzzy matching - kept for backward compatibility only
     * @param {string} skill - Skill to search for
     * @param {string} text - Text to search in
     * @returns {Object} { found: boolean, confidence: number }
     */
    findSkillFuzzy_DEPRECATED(skill, text) {
        const normalizedSkill = skill.toLowerCase().trim();
        const normalizedText = text.toLowerCase();

        // Exact match
        if (normalizedText.includes(normalizedSkill)) {
            return { found: true, confidence: 1.0 };
        }

        // Fuzzy match for variations
        const variations = this.generateSkillVariations(normalizedSkill);
        for (const variation of variations) {
            if (normalizedText.includes(variation)) {
                return { found: true, confidence: 0.8 };
            }
        }

        // Partial match using word overlap
        const skillTokens = this.tokenize(normalizedSkill);
        const textTokens = this.tokenize(normalizedText);
        const overlap = skillTokens.filter(token => textTokens.includes(token));

        if (overlap.length > 0) {
            const confidence = overlap.length / skillTokens.length;
            return { found: confidence > 0.6, confidence };
        }

        return { found: false, confidence: 0 };
    }

    /**
     * Generate skill variations for fuzzy matching
     */
    generateSkillVariations(skill) {
        const variations = [skill];

        // Common variations
        const replacements = {
            'javascript': ['js', 'ecmascript'],
            'typescript': ['ts'],
            'python': ['py'],
            'node.js': ['nodejs', 'node'],
            'react.js': ['react', 'reactjs'],
            'vue.js': ['vue', 'vuejs'],
            'angular.js': ['angular', 'angularjs'],
            'c++': ['cpp', 'cplusplus'],
            'c#': ['csharp', 'c sharp'],
            'objective-c': ['objective c', 'objc']
        };

        Object.entries(replacements).forEach(([key, values]) => {
            if (skill.includes(key)) {
                values.forEach(val => {
                    variations.push(skill.replace(key, val));
                });
            }
        });

        return variations;
    }

    /**
     * Normalize education degree for comparison
     */
    normalizeEducation(degree) {
        if (!degree) return null;

        const lower = degree.toLowerCase();

        if (/phd|doctorate|doctoral/i.test(lower)) return 'PhD';
        if (/master|m\.s\.|m\.a\.|mba|m\.tech/i.test(lower)) return 'Masters';
        if (/bachelor|b\.s\.|b\.a\.|b\.tech|b\.e\./i.test(lower)) return 'Bachelors';
        if (/associate|a\.s\.|a\.a\./i.test(lower)) return 'Associates';
        if (/diploma|certificate/i.test(lower)) return 'Diploma';

        return degree;
    }

    /**
     * Compare education levels
     * @returns {number} 1 if resume >= required, 0.5 if lower but close, 0 if insufficient
     */
    compareEducation(resumeEd, requiredEd) {
        if (!requiredEd) return 1; // No requirement

        const educationLevels = {
            'Diploma': 1,
            'Associates': 2,
            'Bachelors': 3,
            'Masters': 4,
            'PhD': 5
        };

        const resumeLevel = educationLevels[this.normalizeEducation(resumeEd)] || 0;
        const requiredLevel = educationLevels[this.normalizeEducation(requiredEd)] || 0;

        if (resumeLevel >= requiredLevel) return 1;
        if (resumeLevel === requiredLevel - 1) return 0.5; // One level below
        return 0;
    }
}

module.exports = new TextAnalyzer();
