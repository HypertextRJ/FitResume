/**
 * Rejection Analyzer
 * 
 * Identifies top reasons why an ATS might reject this resume
 * Based on actual scoring gaps and rule failures
 */

const SCORING_CONFIG = require('../config/scoring.config');

class RejectionAnalyzer {
    /**
     * Analyze rejection risk
     * @param {Object} matchResult - Complete match result from matcher
     * @param {Object} jdData - Job description data
     * @returns {Array} Top rejection reasons
     */
    analyzeRejectionReasons(matchResult, jdData) {
        const reasons = [];
        const { breakdown, score } = matchResult;

        // Analyze required skills gap
        if (breakdown.requiredSkills) {
            const { missingSkills, partialMatches, totalRequired } = breakdown.requiredSkills;

            if (missingSkills && missingSkills.length > 0) {
                const missingCount = missingSkills.length;
                const severity = missingCount >= totalRequired * 0.5 ? 'CRITICAL' : 'HIGH';

                reasons.push({
                    reason: `Missing ${missingCount} of ${totalRequired} required skills`,
                    severity,
                    impact: `${missingCount * 7} points lost`,
                    details: `Required but missing: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? '...' : ''}`,
                    category: 'Required Skills'
                });
            }

            if (partialMatches && partialMatches.length >= totalRequired * 0.3) {
                reasons.push({
                    reason: 'Many skills only partially match job requirements',
                    severity: 'MEDIUM',
                    impact: 'Reduced skill score due to partial matches',
                    details: `${partialMatches.length} skills found but not exact matches`,
                    category: 'Required Skills'
                });
            }
        }

        // Analyze experience gap
        if (breakdown.experience) {
            const { required, actual, difference } = breakdown.experience;

            if (required > 0 && difference < -1) {
                const yearsShort = Math.abs(difference);
                const severity = yearsShort >= 3 ? 'CRITICAL' : 'HIGH';

                reasons.push({
                    reason: `${yearsShort} years short of required experience`,
                    severity,
                    impact: `${breakdown.experience.penalty || 0} points penalty`,
                    details: `Job requires ${required} years, resume shows ${actual} years`,
                    category: 'Experience'
                });
            }
        }

        // Analyze education gap
        if (breakdown.education) {
            const { required, verdict } = breakdown.education;

            if (required && verdict && verdict.includes('lower') || verdict.includes('missing')) {
                reasons.push({
                    reason: 'Does not meet minimum education requirement',
                    severity: 'HIGH',
                    impact: `${15 - (breakdown.education.points || 0)} points lost`,
                    details: `Requires ${required}, but qualification not clearly demonstrated`,
                    category: 'Education'
                });
            }
        }

        // Analyze keyword density
        if (breakdown.keywordDensity) {
            const { density, tier } = breakdown.keywordDensity;

            if (tier === 'POOR' || tier === 'VERY_POOR') {
                reasons.push({
                    reason: 'Resume lacks industry terminology from job description',
                    severity: 'MEDIUM',
                    impact: `${10 - (breakdown.keywordDensity.points || 0)} points lost`,
                    details: `Only ${Math.round(density * 100)}% keyword match with job description`,
                    category: 'Keywords'
                });
            }
        }

        // Analyze format issues
        if (breakdown.formatClarity && breakdown.formatClarity.points < 3) {
            reasons.push({
                reason: 'Resume format may be difficult for ATS to parse',
                severity: 'LOW',
                impact: 'Parsing errors could miss important information',
                details: 'Consider using a cleaner, more structured format',
                category: 'Format'
            });
        }

        // Sort by severity and return top 4
        const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        reasons.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return reasons.slice(0, 4);
    }

    /**
     * Generate human-readable rejection summary
     */
    generateRejectionSummary(reasons) {
        if (reasons.length === 0) {
            return 'No major rejection risks identified.';
        }

        const summary = reasons.map((r, i) =>
            `${i + 1}. ${r.reason} (${r.severity})`
        ).join('\n');

        return `Likely ATS rejection reasons:\n${summary}`;
    }
}

module.exports = new RejectionAnalyzer();
