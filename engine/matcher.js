const SCORING_CONFIG = require('../config/scoring.config');
const textAnalyzer = require('../utils/textAnalyzer');

/**
 * Matcher Engine
 * Core strict scoring algorithm for resume-JD compatibility
 * 
 * Philosophy: Harsh, realistic, job-specific scoring
 */

class Matcher {
    /**
     * Calculate complete match score
     * @param {Object} resumeData - Parsed resume data
     * @param {Object} jdData - Parsed job description data
     * @returns {Object} Complete match result with breakdown
     */
    async calculateMatch(resumeData, jdData) {
        // Calculate individual category scores
        const requiredSkillsScore = this.scoreRequiredSkills(resumeData, jdData);
        const experienceScore = this.scoreExperience(resumeData, jdData);
        const educationScore = this.scoreEducation(resumeData, jdData);
        const preferredSkillsScore = this.scorePreferredSkills(resumeData, jdData);
        const keywordScore = this.scoreKeywordDensity(resumeData, jdData);
        const formatScore = resumeData.parseQuality || SCORING_CONFIG.FORMAT.MINOR_ISSUES;

        // Calculate total
        const totalScore = Math.round(
            requiredSkillsScore.points +
            experienceScore.points +
            educationScore.points +
            preferredSkillsScore.points +
            keywordScore.points +
            formatScore
        );

        // Determine score range and label
        const scoreRange = this.getScoreRange(totalScore);

        return {
            totalScore,
            score: totalScore, // Alias for compatibility with other services
            scoreLabel: scoreRange.label,
            scoreColor: scoreRange.color,
            breakdown: {
                requiredSkills: requiredSkillsScore,
                experience: experienceScore,
                education: educationScore,
                preferredSkills: preferredSkillsScore,
                keywordDensity: keywordScore,
                formatClarity: {
                    points: formatScore,
                    maxPoints: SCORING_CONFIG.WEIGHTS.FORMAT_CLARITY,
                    details: this.getFormatDetails(resumeData.parseQuality)
                }
            }
        };
    }

    /**
     * Score required skills (35 points max)
     * HARSH: Each missing required skill = -7 points
     * Uses STRICT predefined skill similarity (max 50% partial credit)
     */
    scoreRequiredSkills(resumeData, jdData) {
        const maxPoints = SCORING_CONFIG.WEIGHTS.REQUIRED_SKILLS;
        const requiredSkills = jdData.requiredSkills || [];

        // CRITICAL FIX: If NO required skills in JD, give 0 points (not full points!)
        if (requiredSkills.length === 0) {
            return {
                points: 0,  // Changed from maxPoints - NO FREE POINTS!
                maxPoints,
                matchedSkills: [],
                missingSkills: [],
                partialMatches: [],
                verdict: 'No required skills specified in job description'
            };
        }

        const resumeText = resumeData.rawText.toLowerCase();

        // Extract all skills found in resume for strict similarity checking
        const resumeSkills = resumeData.skills || [];

        const matchedSkills = [];
        const missingSkills = [];
        const partialMatches = [];

        let pointsEarned = maxPoints;

        requiredSkills.forEach(skill => {
            // Use strict rule-based matching with skill list
            const skillCheck = textAnalyzer.findSkill(skill, resumeText, resumeSkills);

            if (skillCheck.found && skillCheck.confidence >= 0.9) {
                // Full match (exact or 90%+ confidence)
                matchedSkills.push({
                    skill,
                    matchedAs: skillCheck.matchedSkill || skill
                });
            } else if (skillCheck.found && skillCheck.confidence > 0) {
                // Partial match - STRICT: confidence already capped at 50% max
                partialMatches.push({
                    skill,
                    matchedSkill: skillCheck.matchedSkill,
                    similarity: skillCheck.similarity,
                    credit: skillCheck.confidence,
                    explanation: skillCheck.explanation
                });

                // Calculate penalty: full penalty * (1 - credit)
                // Example: 60% similarity → 30% credit → 70% penalty
                const penalty = SCORING_CONFIG.REQUIRED_SKILLS.POINTS_PER_SKILL * (1 - skillCheck.confidence);
                pointsEarned -= penalty;
            } else {
                // Missing - full penalty
                missingSkills.push(skill);
                pointsEarned -= SCORING_CONFIG.REQUIRED_SKILLS.POINTS_PER_SKILL;
            }
        });

        return {
            points: Math.max(0, pointsEarned),
            maxPoints,
            matchedSkills,
            missingSkills,
            partialMatches,
            totalRequired: requiredSkills.length
        };
    }

    /**
     * Score experience (25 points max)
     * HARSH: Under-qualified or over-qualified both penalized
     */
    scoreExperience(resumeData, jdData) {
        const maxPoints = SCORING_CONFIG.WEIGHTS.EXPERIENCE;
        const required = jdData.requiredExperience || 0;
        const actual = resumeData.totalYearsExperience || 0;

        // If NO experience requirement in JD, score based on what candidate has
        // (not 0, not full - proportional credit)
        if (required === 0) {
            let points = 0;

            if (actual >= 10) {
                points = maxPoints;  // 10+ years = full credit
            } else if (actual >= 5) {
                points = maxPoints * 0.8;  // 5-9 years = 80%
            } else if (actual >= 3) {
                points = maxPoints * 0.6;  // 3-4 years = 60%
            } else if (actual >= 1) {
                points = maxPoints * 0.4;  // 1-2 years = 40%
            } else {
                points = 0;  // 0 years = 0 points
            }

            return {
                points: Math.round(points),
                maxPoints,
                required: 0,
                actual,
                difference: 0,
                verdict: `No specific requirement - ${actual} years credited`
            };
        }

        const difference = actual - required;
        let points = maxPoints;
        let verdict = '';

        if (difference >= 0 && difference < 5) {
            // Perfect match or slightly more experienced
            verdict = 'Excellent match';
        } else if (difference >= 5) {
            // Over-qualified
            points -= SCORING_CONFIG.EXPERIENCE.PENALTIES.OVER_QUALIFIED_5_PLUS;
            verdict = 'Over-qualified (may be flight risk)';
        } else if (difference >= -2) {
            // Slightly under-qualified
            points -= SCORING_CONFIG.EXPERIENCE.PENALTIES.SHORT_0_2_YEARS;
            verdict = '0-2 years short';
        } else if (difference >= -4) {
            // Moderately under-qualified
            points -= SCORING_CONFIG.EXPERIENCE.PENALTIES.SHORT_2_4_YEARS;
            verdict = '2-4 years short';
        } else {
            // Severely under-qualified
            points -= SCORING_CONFIG.EXPERIENCE.PENALTIES.SHORT_4_PLUS_YEARS;
            verdict = '4+ years short (significantly under-qualified)';
        }

        return {
            points: Math.max(0, points),
            maxPoints,
            required,
            actual,
            difference,
            verdict
        };
    }

    /**
     * Score education (15 points max)
     */
    scoreEducation(resumeData, jdData) {
        const maxPoints = SCORING_CONFIG.WEIGHTS.EDUCATION;
        const required = jdData.educationRequirement;
        const resumeEducation = resumeData.education || [];

        // If NO education requirement, score based on highest degree
        if (!required) {
            let points = 0;

            // Find highest degree
            const degreeHierarchy = ['PhD', 'Masters', 'Bachelors', 'Associates', 'Diploma'];
            let highestDegree = null;

            for (const degree of degreeHierarchy) {
                const hasThisDegree = resumeEducation.some(ed =>
                    textAnalyzer.normalizeEducation(ed) === degree
                );
                if (hasThisDegree) {
                    highestDegree = degree;
                    break;
                }
            }

            // Give proportional credit based on highest degree
            if (highestDegree === 'PhD') points = maxPoints;
            else if (highestDegree === 'Masters') points = maxPoints * 0.8;
            else if (highestDegree === 'Bachelors') points = maxPoints * 0.6;
            else if (highestDegree === 'Associates') points = maxPoints * 0.4;
            else if (highestDegree === 'Diploma') points = maxPoints * 0.2;
            else points = 0;  // No degree

            return {
                points: Math.round(points),
                maxPoints,
                required: 'None specified',
                found: resumeEducation,
                highestDegree: highestDegree || 'None found',
                verdict: `No requirement - ${highestDegree || 'no degree'} credited`
            };
        }

        // Find highest degree in resume
        let highestDegree = null;
        const degreeHierarchy = ['PhD', 'Masters', 'Bachelors', 'Associates', 'Diploma'];

        for (const degree of degreeHierarchy) {
            const hasThisDegree = resumeEducation.some(ed =>
                textAnalyzer.normalizeEducation(ed) === degree
            );
            if (hasThisDegree) {
                highestDegree = degree;
                break;
            }
        }

        const comparison = textAnalyzer.compareEducation(highestDegree, required);
        let points = 0;
        let verdict = '';

        if (comparison === 1) {
            points = SCORING_CONFIG.EDUCATION.EXACT_MATCH;
            verdict = 'Meets or exceeds requirement';
        } else if (comparison === 0.5) {
            points = SCORING_CONFIG.EDUCATION.LOWER_DEGREE;
            verdict = 'One level below (may be acceptable with experience)';
        } else {
            points = SCORING_CONFIG.EDUCATION.MISSING_REQUIRED;
            verdict = 'Does not meet requirement';
        }

        return {
            points,
            maxPoints,
            required,
            found: resumeEducation,
            highestDegree: highestDegree || 'None found',
            verdict
        };
    }

    /**
     * Score preferred skills (15 points max)
     * Each preferred skill = +3 points (max 5 skills counted)
     */
    scorePreferredSkills(resumeData, jdData) {
        const maxPoints = SCORING_CONFIG.WEIGHTS.PREFERRED_SKILLS;
        const preferredSkills = jdData.preferredSkills || [];

        if (preferredSkills.length === 0) {
            return {
                points: 0,
                maxPoints,
                matchedSkills: [],
                totalPreferred: 0
            };
        }

        const resumeText = resumeData.rawText.toLowerCase();
        const matchedSkills = [];

        preferredSkills.forEach(skill => {
            const skillCheck = textAnalyzer.findSkill(skill, resumeText);
            if (skillCheck.found && skillCheck.confidence >= 0.7) {
                matchedSkills.push(skill);
            }
        });

        const skillsCounted = Math.min(matchedSkills.length, SCORING_CONFIG.PREFERRED_SKILLS.MAX_SKILLS_COUNTED);
        const points = skillsCounted * SCORING_CONFIG.PREFERRED_SKILLS.POINTS_PER_SKILL;

        return {
            points,
            maxPoints,
            matchedSkills,
            totalPreferred: preferredSkills.length,
            skillsCounted
        };
    }

    /**
     * Score keyword density (10 points max)
     * Measures how many JD keywords appear in resume
     */
    scoreKeywordDensity(resumeData, jdData) {
        const maxPoints = SCORING_CONFIG.WEIGHTS.KEYWORD_DENSITY;

        // Extract keywords from both
        const resumeKeywords = textAnalyzer.extractKeywords(resumeData.rawText, 50);
        const jdKeywords = jdData.keywords && jdData.keywords.length > 0
            ? jdData.keywords
            : textAnalyzer.extractKeywords(jdData.original, 30);

        const density = textAnalyzer.calculateKeywordDensity(resumeKeywords, jdKeywords);

        let points = 0;
        let verdict = '';

        if (density >= SCORING_CONFIG.KEYWORD_DENSITY.EXCELLENT_THRESHOLD) {
            points = SCORING_CONFIG.KEYWORD_DENSITY.POINTS.EXCELLENT;
            verdict = 'Excellent keyword alignment';
        } else if (density >= SCORING_CONFIG.KEYWORD_DENSITY.GOOD_THRESHOLD) {
            points = SCORING_CONFIG.KEYWORD_DENSITY.POINTS.GOOD;
            verdict = 'Good keyword presence';
        } else if (density >= SCORING_CONFIG.KEYWORD_DENSITY.FAIR_THRESHOLD) {
            points = SCORING_CONFIG.KEYWORD_DENSITY.POINTS.FAIR;
            verdict = 'Fair keyword match';
        } else if (density >= SCORING_CONFIG.KEYWORD_DENSITY.POOR_THRESHOLD) {
            points = SCORING_CONFIG.KEYWORD_DENSITY.POINTS.POOR;
            verdict = 'Poor keyword alignment';
        } else {
            points = SCORING_CONFIG.KEYWORD_DENSITY.POINTS.VERY_POOR;
            verdict = 'Very poor keyword match';
        }

        return {
            points,
            maxPoints,
            density: Math.round(density * 100),
            verdict,
            matchedKeywords: resumeKeywords.filter(k =>
                jdKeywords.some(jk => jk.toLowerCase() === k.toLowerCase())
            ).slice(0, 10)
        };
    }

    /**
     * Get score range and label
     */
    getScoreRange(score) {
        const ranges = SCORING_CONFIG.SCORE_RANGES;

        for (const [key, range] of Object.entries(ranges)) {
            if (score >= range.min && score <= range.max) {
                return range;
            }
        }

        return ranges.POOR;
    }

    /**
     * Get format quality details
     */
    getFormatDetails(parseQuality) {
        if (parseQuality >= 5) return 'Perfect - Clean, well-structured resume';
        if (parseQuality >= 3) return 'Good - Minor formatting issues';
        if (parseQuality >= 1) return 'Fair - Some parsing difficulties';
        return 'Poor - Significant formatting issues';
    }
}

module.exports = new Matcher();
