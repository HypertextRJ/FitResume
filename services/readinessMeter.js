/**
 * Readiness Meter
 * 
 * Multi-dimensional resume assessment
 * 3 independent scores: ATS Compatibility, Recruiter Readability, Evidence Strength
 */

class ReadinessMeter {
    /**
     * Calculate 3D readiness scores
     * @param {Object} matchResult - Match result
     * @param {Object} resumeData - Resume data
     * @param {Object} evidenceSummary - From skill evidence analyzer
     * @returns {Object} Three independent scores
     */
    calculateReadiness(matchResult, resumeData, evidenceSummary) {
        return {
            atsCompatibility: this.calculateATSCompatibility(matchResult),
            recruiterReadability: this.calculateRecruiterReadability(resumeData, matchResult),
            evidenceStrength: this.calculateEvidenceStrength(evidenceSummary),
            explanation: this.generateExplanation()
        };
    }

    /**
     * ATS Compatibility (0-100)
     * This is the main score
     */
    calculateATSCompatibility(matchResult) {
        return {
            score: matchResult.score,
            label: matchResult.scoreLabel,
            explanation: 'How well your resume matches the job requirements algorithmically'
        };
    }

    /**
     * Recruiter Readability (0-100)
     * Format + clarity + structure
     */
    calculateRecruiterReadability(resumeData, matchResult) {
        let score = 50; // Base score

        // Format quality (+30 max)
        if (matchResult.breakdown.formatClarity) {
            score += (matchResult.breakdown.formatClarity.points / 5) * 30;
        }

        // Structure clarity (+20 max)
        const hasStructure = this.checkStructureClarity(resumeData);
        score += hasStructure ? 20 : 0;

        // Readability (+20 max)
        const readability = this.checkReadability(resumeData);
        score += readability;

        return {
            score: Math.min(100, Math.round(score)),
            label: this.getReadabilityLabel(score),
            explanation: 'How easy it is for a recruiter to quickly scan and understand your resume'
        };
    }

    /**
     * Evidence Strength (0-100)
     * Quality of skill demonstrations
     */
    calculateEvidenceStrength(evidenceSummary) {
        if (!evidenceSummary) {
            return {
                score: 50,
                label: 'Not assessed',
                explanation: 'Unable to assess evidence strength'
            };
        }

        const { strong, moderate, weak, total } = evidenceSummary;

        // Calculate weighted score
        const score = Math.round(
            ((strong * 100) + (moderate * 60) + (weak * 20)) / total
        );

        return {
            score,
            label: this.getEvidenceLabel(score),
            explanation: 'How well your skills are demonstrated with concrete examples',
            breakdown: {
                strongEvidence: strong,
                moderateEvidence: moderate,
                weakEvidence: weak,
                total
            }
        };
    }

    /**
     * Check structure clarity
     */
    checkStructureClarity(resumeData) {
        const hasContact = resumeData.contact && Object.keys(resumeData.contact).length > 0;
        const hasExperience = resumeData.experience && resumeData.experience.length > 0;
        const hasEducation = resumeData.education && resumeData.education.length > 0;
        const hasSkills = resumeData.skills && resumeData.skills.length > 0;

        return hasContact && hasExperience && hasEducation && hasSkills;
    }

    /**
     * Check readability
     */
    checkReadability(resumeData) {
        let score = 0;

        // Has clear sections (+5)
        if (resumeData.rawText && resumeData.rawText.includes('EXPERIENCE')) {
            score += 5;
        }

        // Has dates in experience (+5)
        if (resumeData.experience && resumeData.experience.some(exp => exp.duration)) {
            score += 5;
        }

        // Not too long (+5 if under 2 pages ~1000 words)
        if (resumeData.rawText && resumeData.rawText.split(' ').length < 1000) {
            score += 5;
        }

        // Has quantifiable achievements (+5)
        if (resumeData.rawText && /\d+%|\d+ (users?|projects?|clients?)/.test(resumeData.rawText)) {
            score += 5;
        }

        return score;
    }

    /**
     * Labels
     */
    getReadabilityLabel(score) {
        if (score >= 80) return 'Excellent - Very recruiter-friendly';
        if (score >= 60) return 'Good - Clear and scannable';
        if (score >= 40) return 'Fair - Could be clearer';
        return 'Poor - Difficult to scan quickly';
    }

    getEvidenceLabel(score) {
        if (score >= 80) return 'Strong - Well-demonstrated skills';
        if (score >= 60) return 'Good - Most skills shown in context';
        if (score >= 40) return 'Moderate - Some skills need examples';
        return 'Weak - Skills listed but not proven';
    }

    /**
     * Generate explanation
     */
    generateExplanation() {
        return {
            atsCompatibility: 'Measures how well resume matches job requirements using strict algorithms',
            recruiterReadability: 'Measures how easy it is for a human recruiter to quickly understand your qualifications',
            evidenceStrength: 'Measures how well your claimed skills are backed by concrete examples and achievements'
        };
    }
}

module.exports = new ReadinessMeter();
