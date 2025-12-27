/**
 * Explainer Service
 * Generates detailed, human-readable explanations for match scores
 * 
 * Philosophy: Every score must be traceable and explainable
 */

class Explainer {
    /**
     * Generate complete explanation for match result
     * @param {Object} matchResult - Result from matcher
     * @param {Object} resumeData - Original resume data
     * @param {Object} jdData - Original JD data
     * @returns {Object} Structured explanation
     */
    generateExplanation(matchResult, resumeData, jdData) {
        return {
            summary: this.generateSummary(matchResult),
            strengths: this.generateStrengths(matchResult),
            gaps: this.generateGaps(matchResult),
            recommendations: this.generateRecommendations(matchResult, jdData),
            scoreJustification: this.generateScoreJustification(matchResult)
        };
    }

    /**
     * Generate high-level summary
     */
    generateSummary(matchResult) {
        const score = matchResult.totalScore;
        const label = matchResult.scoreLabel;

        if (score >= 90) {
            return `Outstanding match (${score}/100). This resume demonstrates exceptional alignment with the job requirements. The candidate possesses nearly all required qualifications and shows strong relevance across multiple dimensions.`;
        } else if (score >= 76) {
            return `Very strong match (${score}/100). This resume shows significant alignment with the job requirements. The candidate meets most critical criteria with only minor gaps.`;
        } else if (score >= 61) {
            return `Good match (${score}/100). This resume demonstrates moderate alignment with the job requirements. The candidate has relevant qualifications but some important gaps exist.`;
        } else if (score >= 41) {
            return `Fair match (${score}/100). This resume shows limited alignment with the job requirements. Several important qualifications are missing or insufficient.`;
        } else {
            return `Poor match (${score}/100). This resume demonstrates minimal alignment with the job requirements. Significant gaps exist across multiple critical areas.`;
        }
    }

    /**
     * Generate list of strengths with evidence
     */
    generateStrengths(matchResult) {
        const strengths = [];
        const { breakdown } = matchResult;

        // Required Skills
        if (breakdown.requiredSkills.matchedSkills.length > 0) {
            const matched = breakdown.requiredSkills.matchedSkills;
            strengths.push({
                category: 'Required Skills',
                description: `Possesses ${matched.length} of ${breakdown.requiredSkills.totalRequired} required skills`,
                evidence: matched.slice(0, 5).join(', ') + (matched.length > 5 ? '...' : ''),
                impact: `+${breakdown.requiredSkills.points.toFixed(1)} points`
            });
        }

        // Partial skill matches
        if (breakdown.requiredSkills.partialMatches.length > 0) {
            const partial = breakdown.requiredSkills.partialMatches;
            strengths.push({
                category: 'Related Skills',
                description: `Has ${partial.length} related/similar skills to requirements`,
                evidence: partial.map(p => p.skill).slice(0, 3).join(', '),
                impact: 'Partial credit given'
            });
        }

        // Experience
        if (breakdown.experience.points > 15) {
            strengths.push({
                category: 'Experience',
                description: breakdown.experience.verdict,
                evidence: `${breakdown.experience.actual} years (required: ${breakdown.experience.required})`,
                impact: `+${breakdown.experience.points.toFixed(1)} points`
            });
        }

        // Education
        if (breakdown.education.points >= 10) {
            strengths.push({
                category: 'Education',
                description: breakdown.education.verdict,
                evidence: `${breakdown.education.highestDegree} (required: ${breakdown.education.required})`,
                impact: `+${breakdown.education.points.toFixed(1)} points`
            });
        }

        // Preferred Skills
        if (breakdown.preferredSkills.matchedSkills.length > 0) {
            strengths.push({
                category: 'Preferred Skills',
                description: `Has ${breakdown.preferredSkills.matchedSkills.length} preferred/bonus skills`,
                evidence: breakdown.preferredSkills.matchedSkills.slice(0, 5).join(', '),
                impact: `+${breakdown.preferredSkills.points.toFixed(1)} points`
            });
        }

        // Keywords
        if (breakdown.keywordDensity.density >= 50) {
            strengths.push({
                category: 'Keyword Alignment',
                description: breakdown.keywordDensity.verdict,
                evidence: `${breakdown.keywordDensity.density}% density - ${breakdown.keywordDensity.matchedKeywords.slice(0, 5).join(', ')}`,
                impact: `+${breakdown.keywordDensity.points.toFixed(1)} points`
            });
        }

        return strengths.length > 0 ? strengths : [{
            category: 'General',
            description: 'Resume was successfully parsed',
            evidence: 'Basic format is readable',
            impact: 'Minimal points'
        }];
    }

    /**
     * Generate list of gaps/weaknesses with specifics
     */
    generateGaps(matchResult) {
        const gaps = [];
        const { breakdown } = matchResult;

        // Missing Required Skills - CRITICAL
        if (breakdown.requiredSkills.missingSkills.length > 0) {
            const missing = breakdown.requiredSkills.missingSkills;
            const penalty = missing.length * 6; // Each skill = 6 points
            gaps.push({
                category: 'Missing Required Skills',
                severity: 'CRITICAL',
                description: `${missing.length} required skills are missing from the resume`,
                specifics: missing.join(', '),
                impact: `-${penalty} points`,
                priority: 1
            });
        }

        // Experience Gap
        if (breakdown.experience.difference < -2) {
            const yearsShort = Math.abs(breakdown.experience.difference);
            gaps.push({
                category: 'Experience Shortage',
                severity: yearsShort >= 4 ? 'CRITICAL' : 'HIGH',
                description: breakdown.experience.verdict,
                specifics: `${yearsShort} years below requirement (has ${breakdown.experience.actual}, needs ${breakdown.experience.required})`,
                impact: `-${(breakdown.experience.maxPoints - breakdown.experience.points).toFixed(1)} points`,
                priority: 2
            });
        }

        // Over-qualified
        if (breakdown.experience.difference >= 5) {
            gaps.push({
                category: 'Over-Qualification',
                severity: 'MEDIUM',
                description: 'Candidate is significantly over-qualified',
                specifics: `${breakdown.experience.difference} years above requirement - may be flight risk or salary mismatch`,
                impact: `-${(breakdown.experience.maxPoints - breakdown.experience.points).toFixed(1)} points`,
                priority: 4
            });
        }

        // Education Gap
        if (breakdown.education.points < 10) {
            gaps.push({
                category: 'Education Requirement',
                severity: breakdown.education.points === 0 ? 'CRITICAL' : 'MEDIUM',
                description: breakdown.education.verdict,
                specifics: `Required: ${breakdown.education.required}, Found: ${breakdown.education.highestDegree}`,
                impact: `-${(breakdown.education.maxPoints - breakdown.education.points).toFixed(1)} points`,
                priority: 3
            });
        }

        // Low Keyword Density
        if (breakdown.keywordDensity.density < 30) {
            gaps.push({
                category: 'Keyword Alignment',
                severity: 'MEDIUM',
                description: 'Resume lacks key industry/role terminology',
                specifics: `Only ${breakdown.keywordDensity.density}% keyword match - resume may not be optimized for this role`,
                impact: `-${(breakdown.keywordDensity.maxPoints - breakdown.keywordDensity.points).toFixed(1)} points`,
                priority: 5
            });
        }

        // Format Issues
        if (breakdown.formatClarity.points < 3) {
            gaps.push({
                category: 'Resume Format',
                severity: 'LOW',
                description: 'Resume has formatting or parsing issues',
                specifics: breakdown.formatClarity.details,
                impact: `-${(breakdown.formatClarity.maxPoints - breakdown.formatClarity.points).toFixed(1)} points`,
                priority: 6
            });
        }

        return gaps.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations(matchResult, jdData) {
        const recommendations = [];
        const { breakdown } = matchResult;

        // Missing Skills Recommendations
        if (breakdown.requiredSkills.missingSkills.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Add Missing Required Skills',
                details: `Include these required skills in your resume if you have them: ${breakdown.requiredSkills.missingSkills.slice(0, 5).join(', ')}`,
                expectedImpact: `+${breakdown.requiredSkills.missingSkills.length * 6} points if all added`
            });
        }

        // Experience Recommendations
        if (breakdown.experience.difference < -1) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Highlight Relevant Experience',
                details: 'Emphasize responsibilities and achievements that demonstrate experience equivalent to the required years. Consider including relevant internships, freelance work, or major projects.',
                expectedImpact: 'May partially offset experience gap'
            });
        }

        // Education Recommendations
        if (breakdown.education.points < 10 && breakdown.education.required) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Address Education Requirement',
                details: `Consider highlighting relevant certifications, ongoing education, or equivalent practical experience to compensate for ${breakdown.education.required} requirement.`,
                expectedImpact: 'Limited points but improves overall perception'
            });
        }

        // Keyword Optimization
        if (breakdown.keywordDensity.density < 50) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Optimize for Keywords',
                details: 'Incorporate more industry-specific terminology and role-relevant keywords from the job description naturally throughout your resume.',
                expectedImpact: `Potential +${(10 - breakdown.keywordDensity.points).toFixed(1)} points`
            });
        }

        // Preferred Skills
        const unmatchedPreferred = (jdData.preferredSkills || [])
            .filter(skill => !breakdown.preferredSkills.matchedSkills.includes(skill));

        if (unmatchedPreferred.length > 0) {
            recommendations.push({
                priority: 'LOW',
                action: 'Add Preferred Skills',
                details: `Consider adding these bonus skills if relevant: ${unmatchedPreferred.slice(0, 5).join(', ')}`,
                expectedImpact: `+${Math.min(unmatchedPreferred.length, 3) * 3} points`
            });
        }

        // Format Improvement
        if (breakdown.formatClarity.points < 5) {
            recommendations.push({
                priority: 'LOW',
                action: 'Improve Resume Format',
                details: 'Ensure your resume is ATS-friendly with clear sections, standard fonts, and minimal complex formatting. Use standard headers like "Experience", "Education", "Skills".',
                expectedImpact: `+${(5 - breakdown.formatClarity.points).toFixed(1)} points`
            });
        }

        return recommendations;
    }

    /**
     * Generate detailed score justification
     */
    generateScoreJustification(matchResult) {
        const { breakdown } = matchResult;

        return {
            breakdown: [
                {
                    category: 'Required Skills',
                    earned: breakdown.requiredSkills.points.toFixed(1),
                    possible: breakdown.requiredSkills.maxPoints,
                    percentage: ((breakdown.requiredSkills.points / breakdown.requiredSkills.maxPoints) * 100).toFixed(0),
                    explanation: `Matched ${breakdown.requiredSkills.matchedSkills.length}/${breakdown.requiredSkills.totalRequired} required skills, missing ${breakdown.requiredSkills.missingSkills.length}`
                },
                {
                    category: 'Experience',
                    earned: breakdown.experience.points.toFixed(1),
                    possible: breakdown.experience.maxPoints,
                    percentage: ((breakdown.experience.points / breakdown.experience.maxPoints) * 100).toFixed(0),
                    explanation: breakdown.experience.verdict
                },
                {
                    category: 'Education',
                    earned: breakdown.education.points.toFixed(1),
                    possible: breakdown.education.maxPoints,
                    percentage: ((breakdown.education.points / breakdown.education.maxPoints) * 100).toFixed(0),
                    explanation: breakdown.education.verdict
                },
                {
                    category: 'Preferred Skills',
                    earned: breakdown.preferredSkills.points.toFixed(1),
                    possible: breakdown.preferredSkills.maxPoints,
                    percentage: breakdown.preferredSkills.maxPoints > 0
                        ? ((breakdown.preferredSkills.points / breakdown.preferredSkills.maxPoints) * 100).toFixed(0)
                        : '0',
                    explanation: `Matched ${breakdown.preferredSkills.matchedSkills.length}/${breakdown.preferredSkills.totalPreferred} preferred skills`
                },
                {
                    category: 'Keyword Density',
                    earned: breakdown.keywordDensity.points.toFixed(1),
                    possible: breakdown.keywordDensity.maxPoints,
                    percentage: ((breakdown.keywordDensity.points / breakdown.keywordDensity.maxPoints) * 100).toFixed(0),
                    explanation: breakdown.keywordDensity.verdict
                },
                {
                    category: 'Format & Clarity',
                    earned: breakdown.formatClarity.points.toFixed(1),
                    possible: breakdown.formatClarity.maxPoints,
                    percentage: ((breakdown.formatClarity.points / breakdown.formatClarity.maxPoints) * 100).toFixed(0),
                    explanation: breakdown.formatClarity.details
                }
            ],
            total: {
                earned: matchResult.totalScore,
                possible: 100,
                label: matchResult.scoreLabel
            }
        };
    }
}

module.exports = new Explainer();
