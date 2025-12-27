/**
 * Dual View Generator
 * 
 * Generates both ATS and Recruiter perspectives on the same resume
 */

class DualViewGenerator {
    /**
     * Generate both views
     * @param {Object} matchResult - Match result
     * @param {Object} resumeData - Resume data
     * @param {Object} jdData - JD data
     * @returns {Object} Both perspectives
     */
    generateDualViews(matchResult, resumeData, jdData) {
        return {
            atsView: this.generateATSView(matchResult),
            recruiterView: this.generateRecruiterView(matchResult, resumeData, jdData)
        };
    }

    /**
     * ATS View: Strict, keyword-focused, no context
     */
    generateATSView(matchResult) {
        const { score, scoreLabel, breakdown } = matchResult;

        const points = [];

        // Required skills
        if (breakdown.requiredSkills) {
            const { matchedSkills, missingSkills, totalRequired } = breakdown.requiredSkills;
            points.push(`Required skills: ${matchedSkills.length}/${totalRequired} matched`);

            if (missingSkills.length > 0) {
                points.push(`⚠️ Missing: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? '...' : ''}`);
            }
        }

        // Experience
        if (breakdown.experience) {
            const { required, actual } = breakdown.experience;
            if (required > 0) {
                points.push(`Experience: ${actual} years (requirement: ${required} years)`);
            }
        }

        // Education
        if (breakdown.education && breakdown.education.required) {
            points.push(`Education: ${breakdown.education.verdict || 'Checked'}`);
        }

        // Keyword density
        if (breakdown.keywordDensity) {
            const density = breakdown.keywordDensity.density || 0;
            points.push(`Keyword match: ${density}%`);
        }

        return {
            summary: `Algorithmic score: ${score}/100 (${scoreLabel})`,
            evaluation: 'System evaluates based on strict keyword matching, experience years, and structural requirements.',
            keyPoints: points,
            verdict: score >= 75 ? 'LIKELY PASS' : score >= 60 ? 'BORDERLINE' : 'LIKELY REJECT'
        };
    }

    /**
     * Recruiter View: Context-aware, softer interpretation
     */
    generateRecruiterView(matchResult, resumeData, jdData) {
        const { score, breakdown } = matchResult;

        const observations = [];

        // Skills - more nuanced
        if (breakdown.requiredSkills) {
            const { matchedSkills, partialMatches, missingSkills, totalRequired } = breakdown.requiredSkills;

            if (matchedSkills.length >= totalRequired * 0.7) {
                observations.push(`✅ Strong technical fit - demonstrates most required skills`);
            } else if (partialMatches.length > 0) {
                observations.push(`📝 Has related experience that could transfer to required skills`);
            }

            if (missingSkills.length > 0 && missingSkills.length <= 2) {
                observations.push(`💡 Could develop ${missingSkills.join(' and ')} with onboarding`);
            } else if (missingSkills.length > 2) {
                observations.push(`⚠️ Significant skill gaps may require extensive training`);
            }
        }

        // Experience - context matters
        if (breakdown.experience) {
            const { required, actual, difference } = breakdown.experience;

            if (Math.abs(difference) <= 1) {
                observations.push(`✅ Experience level closely matches requirements`);
            } else if (difference < 0 && difference >= -2) {
                observations.push(`📝 Slightly less experience, but could be compensated by strong skills`);
            } else if (difference > 3) {
                observations.push(`💼 More experienced than required - could bring valuable insights`);
            }
        }

        // Overall assessment
        let assessment;
        if (score >= 90) {
            assessment = 'Exceptional candidate - Immediate interview recommended';
        } else if (score >= 76) {
            assessment = 'Strong candidate - Review experience depth and cultural fit';
        } else if (score >= 61) {
            assessment = 'Potential fit - but has significant gaps to verify';
        } else {
            assessment = 'Does not meet core requirements - Likely rejection';
        }

        return {
            summary: `Human assessment: ${assessment}`,
            evaluation: 'This evaluation considers context, potential, and transferable skills beyond strict keyword matching.',
            observations,
            recommendation: this.generateRecommendation(score)
        };
    }

    /**
     * Generate recruiter recommendation
     */
    generateRecommendation(score) {
        if (score >= 80) {
            return 'RECOMMEND: Schedule phone screen';
        } else if (score >= 65) {
            return 'CONSIDER: Review portfolio/GitHub if available';
        } else if (score >= 50) {
            return 'HOLD: Only if hiring is difficult';
        } else {
            return 'REJECT: Focus on stronger matches';
        }
    }
}

module.exports = new DualViewGenerator();
