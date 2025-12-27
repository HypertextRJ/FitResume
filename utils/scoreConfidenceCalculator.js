/**
 * Score Confidence Calculator
 * 
 * Provides confidence bands for final ATS scores
 * Based on AI reliability, data quality, and parsing success
 * 
 * Philosophy: Transparent uncertainty
 * Users deserve to know how confident we are in the score
 */

class ScoreConfidenceCalculator {
    /**
     * Calculate overall confidence for a scoring result
     * 
     * @param {Object} analysisContext - Context from scoring process
     * @returns {Object} Confidence information
     */
    calculateConfidence(analysisContext) {
        const {
            jdParsingMeta = {},
            resumeParsingQuality = 5,
            matchResult = {},
            aiReliabilityData = {}
        } = analysisContext;

        let confidenceScore = 100; // Start at 100% confidence
        const factors = [];

        // Factor 1: JD Parsing Quality (30% weight)
        const jdConfidence = this.assessJDParsingConfidence(jdParsingMeta);
        confidenceScore -= (100 - jdConfidence) * 0.3;
        factors.push({
            factor: 'Job Description Parsing',
            confidence: jdConfidence,
            impact: 'High',
            notes: jdParsingMeta.usedFallback ? 'Used fallback parser' : 'AI parsing successful'
        });

        // Factor 2: Resume Parsing Quality (20% weight)
        const resumeConfidence = this.assessResumeParsingConfidence(resumeParsingQuality);
        confidenceScore -= (100 - resumeConfidence) * 0.2;
        factors.push({
            factor: 'Resume Parsing',
            confidence: resumeConfidence,
            impact: 'Medium',
            notes: this.getResumeQualityNote(resumeParsingQuality)
        });

        // Factor 3: Skill Matching Confidence (25% weight)
        const skillConfidence = this.assessSkillMatchingConfidence(matchResult);
        confidenceScore -= (100 - skillConfidence) * 0.25;
        factors.push({
            factor: 'Skill Matching',
            confidence: skillConfidence,
            impact: 'High',
            notes: this.getSkillMatchingNote(matchResult)
        });

        // Factor 4: Data Completeness (15% weight)
        const completeness = this.assessDataCompleteness(analysisContext);
        confidenceScore -= (100 - completeness) * 0.15;
        factors.push({
            factor: 'Data Completeness',
            confidence: completeness,
            impact: 'Medium',
            notes: this.getCompletenessNote(analysisContext)
        });

        // Factor 5: AI Reliability (10% weight)
        const aiConfidence = this.assessAIReliability(aiReliabilityData);
        confidenceScore -= (100 - aiConfidence) * 0.1;
        factors.push({
            factor: 'AI Reliability',
            confidence: aiConfidence,
            impact: 'Low',
            notes: this.getAIReliabilityNote(aiReliabilityData)
        });

        // Floor at 0
        confidenceScore = Math.max(0, Math.round(confidenceScore));

        // Determine confidence band
        const band = this.getConfidenceBand(confidenceScore);

        return {
            confidenceScore,
            confidenceBand: band.range,
            confidenceTier: band.tier,
            factors,
            explanation: this.generateExplanation(confidenceScore, band),
            userFriendlyMessage: this.getUserFriendlyMessage(confidenceScore, band)
        };
    }

    /**
     * Assess JD parsing confidence
     */
    assessJDParsingConfidence(meta) {
        if (!meta || !meta._meta) {
            return 70; // Default if no meta available
        }

        const { usedAI, usedFallback, confidence } = meta._meta;

        if (usedAI && !usedFallback) {
            // Pure AI - check confidence level
            if (confidence === 'high') return 95;
            if (confidence === 'medium') return 80;
            return 70;
        } else if (usedAI && usedFallback) {
            // AI + Fallback merged
            return 75;
        } else {
            // Fallback only
            return 65;
        }
    }

    /**
     * Assess resume parsing confidence
     */
    assessResumeParsingConfidence(parseQuality) {
        // parseQuality is 0-5
        if (parseQuality >= 5) return 100; // Perfect
        if (parseQuality >= 4) return 85;  // Good
        if (parseQuality >= 3) return 70;  // Fair
        if (parseQuality >= 2) return 55;  // Poor
        return 40; // Very poor
    }

    /**
     * Assess skill matching confidence
     */
    assessSkillMatchingConfidence(matchResult) {
        if (!matchResult.breakdown) return 70;

        const { requiredSkills } = matchResult.breakdown;

        if (!requiredSkills) return 70;

        const { matchedSkills = [], partialMatches = [], missingSkills = [], totalRequired = 1 } = requiredSkills;

        // High confidence if most skills are exact matches
        const exactMatchRate = matchedSkills.length / totalRequired;
        const partialMatchRate = partialMatches.length / totalRequired;

        if (exactMatchRate >= 0.8) return 95;  // 80%+ exact matches
        if (exactMatchRate >= 0.6) return 85;  // 60%+ exact matches
        if (exactMatchRate >= 0.4) return 75;  // 40%+ exact matches
        if (partialMatchRate >= 0.5) return 65; // Mostly partial matches
        return 50; // Mostly missing
    }

    /**
     * Assess data completeness
     */
    assessDataCompleteness(context) {
        const { jdParsingMeta = {}, matchResult = {} } = context;

        let completeness = 100;

        // Check JD data completeness
        if (!jdParsingMeta.requiredSkills || jdParsingMeta.requiredSkills.length === 0) {
            completeness -= 20;
        }
        if (!jdParsingMeta.keywords || jdParsingMeta.keywords.length === 0) {
            completeness -= 10;
        }
        if (jdParsingMeta.requiredExperience === 0 || jdParsingMeta.requiredExperience === null) {
            completeness -= 10;
        }

        // Check resume data (from match result)
        if (!matchResult.breakdown) {
            completeness -= 20;
        }

        return Math.max(0, completeness);
    }

    /**
     * Assess AI reliability
     */
    assessAIReliability(data) {
        if (!data || !data.confidence) return 70; // Default

        // If AI reliability validator was used
        const { confidence, usedFallback, tier } = data;

        if (tier === 'EXCELLENT') return 100;
        if (tier === 'GOOD') return 85;
        if (tier === 'ACCEPTABLE') return 70;
        if (tier === 'POOR') return 55;
        return 40; // UNRELIABLE
    }

    /**
     * Get confidence band based on score
     */
    getConfidenceBand(confidenceScore) {
        if (confidenceScore >= 85) {
            return {
                range: 3,
                tier: 'HIGH',
                label: 'High Confidence',
                color: '#10b981' // Green
            };
        } else if (confidenceScore >= 65) {
            return {
                range: 5,
                tier: 'MEDIUM',
                label: 'Medium Confidence',
                color: '#f59e0b' // Orange
            };
        } else {
            return {
                range: 8,
                tier: 'LOW',
                label: 'Low Confidence',
                color: '#ef4444' // Red
            };
        }
    }

    /**
     * Generate detailed explanation
     */
    generateExplanation(confidenceScore, band) {
        return `Based on parsing quality and AI reliability, we are ${confidenceScore}% confident in this score. ` +
            `The actual score could reasonably be ±${band.range} points from the reported value.`;
    }

    /**
     * Get user-friendly message
     */
    getUserFriendlyMessage(confidenceScore, band) {
        if (band.tier === 'HIGH') {
            return 'This score is highly reliable. The analysis had excellent data quality and strong AI parsing.';
        } else if (band.tier === 'MEDIUM') {
            return 'This score is reasonably reliable. Some data was extracted using fallback methods, which may introduce minor variations.';
        } else {
            return 'This score has lower confidence due to parsing challenges or incomplete data. Consider this as a rough estimate.';
        }
    }

    /**
     * Helper: Get resume quality note
     */
    getResumeQualityNote(quality) {
        if (quality >= 5) return 'Perfect - Clean formatting';
        if (quality >= 4) return 'Good - Minor issues';
        if (quality >= 3) return 'Fair - Some parsing difficulties';
        if (quality >= 2) return 'Poor - Formatting challenges';
        return 'Very poor - Significant parsing issues';
    }

    /**
     * Helper: Get skill matching note
     */
    getSkillMatchingNote(matchResult) {
        if (!matchResult.breakdown?.requiredSkills) {
            return 'Unable to assess';
        }

        const { matchedSkills = [], partialMatches = [] } = matchResult.breakdown.requiredSkills;
        const total = matchedSkills.length + partialMatches.length;

        if (matchedSkills.length >= partialMatches.length * 2) {
            return 'Mostly exact matches';
        } else if (partialMatches.length > matchedSkills.length) {
            return 'Mostly partial matches';
        }
        return 'Mixed exact and partial matches';
    }

    /**
     * Helper: Get completeness note
     */
    getCompletenessNote(context) {
        const { jdParsingMeta = {} } = context;
        const hasSkills = jdParsingMeta.requiredSkills?.length > 0;
        const hasKeywords = jdParsingMeta.keywords?.length > 0;
        const hasExperience = jdParsingMeta.requiredExperience > 0;

        if (hasSkills && hasKeywords && hasExperience) {
            return 'Complete data extraction';
        } else if (hasSkills || hasKeywords) {
            return 'Partial data extraction';
        }
        return 'Minimal data extracted';
    }

    /**
     * Helper: Get AI reliability note
     */
    getAIReliabilityNote(data) {
        if (!data || !data.tier) return 'Not assessed';

        if (data.usedFallback) {
            return `AI ${data.tier} - Fallback used`;
        }
        return `AI ${data.tier}`;
    }

    /**
     * Format score with confidence band for display
     */
    formatScoreWithBand(score, band) {
        return {
            display: `${score} ±${band}`,
            range: {
                min: Math.max(0, score - band),
                max: Math.min(100, score + band)
            },
            text: `${score} points (±${band})`
        };
    }
}

module.exports = new ScoreConfidenceCalculator();
