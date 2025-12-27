/**
 * Risk Flag Detector
 * 
 * Detects silent rejection triggers that recruiters care about
 */

class RiskFlagDetector {
    /**
     * Detect resume risk flags
     * @param {Object} matchResult - Match result
     * @param {Object} resumeData - Resume data  
     * @param {Object} jdData - JD data
     * @returns {Array} Risk flags
     */
    detectRiskFlags(matchResult, resumeData, jdData) {
        const flags = [];

        // Flag 1: Overqualified
        if (matchResult.breakdown.experience) {
            const { required, actual, difference } = matchResult.breakdown.experience;

            if (required > 0 && difference > 5) {
                flags.push({
                    flag: 'Overqualified',
                    severity: 'MEDIUM',
                    explanation: `You have ${actual} years experience but job asks for ${required} years. Recruiters may worry about retention or salary expectations.`,
                    recommendation: 'Consider tailoring resume to emphasize relevant experience within the required range'
                });
            }
        }

        //Flag 2: Skills without evidence
        const skillsListedOnly = this.detectSkillsWithoutEvidence(resumeData);
        if (skillsListedOnly.length >= 3) {
            flags.push({
                flag: 'Skills without evidence',
                severity: 'HIGH',
                explanation: `${skillsListedOnly.length} skills are listed but not demonstrated in any project or work experience.`,
                recommendation: 'Add specific examples showing how you used these skills in real projects',
                affectedSkills: skillsListedOnly.slice(0, 5)
            });
        }

        // Flag 3: Vague descriptions
        if (resumeData.experience) {
            const vagueCount = this.countVagueDescriptions(resumeData.experience);
            if (vagueCount > resumeData.experience.length * 0.4) {
                flags.push({
                    flag: 'Vague role descriptions',
                    severity: 'MEDIUM',
                    explanation: 'Many responsibilities described without specific outcomes or achievements.',
                    recommendation: 'Add measurable results: "Improved X by Y%" or "Delivered Z projects"'
                });
            }
        }

        // Flag 4: Buzzwords without context
        const buzzwords = this.detectBuzzwordsWithoutContext(resumeData);
        if (buzzwords.length >= 3) {
            flags.push({
                flag: 'Buzzwords without context',
                severity: 'LOW',
                explanation: `Terms like "${buzzwords.slice(0, 3).join('", "')}" appear without concrete examples.`,
                recommendation: 'Back up buzzwords with specific achievements or projects'
            });
        }

        // Flag 5: No quantifiable achievements
        if (!this.hasQuantifiableAchievements(resumeData)) {
            flags.push({
                flag: 'Missing quantifiable achievements',
                severity: 'MEDIUM',
                explanation: 'Resume lacks numbers, percentages, or measurable outcomes.',
                recommendation: 'Add metrics: "Reduced costs by 30%", "Managed team of 5", "Delivered 10+ projects"'
            });
        }

        // Flag 6: Experience gap
        const hasGap = this.detectExperienceGap(resumeData);
        if (hasGap) {
            flags.push({
                flag: 'Unexplained experience gap',
                severity: 'MEDIUM',
                explanation: 'There appears to be a gap in work history that is not explained.',
                recommendation: 'Consider briefly explaining gaps (e.g., "Career break", "Freelance work", "Professional development")'
            });
        }

        return flags;
    }

    /**
     * Detect skills mentioned only in skills section
     */
    detectSkillsWithoutEvidence(resumeData) {
        const skillsOnly = [];
        const fullText = (resumeData.rawText || '').toLowerCase();
        const experienceText = resumeData.experience ?
            resumeData.experience.map(e => (e.description || '').toLowerCase()).join(' ') : '';

        if (resumeData.skills) {
            resumeData.skills.forEach(skill => {
                const skillLower = skill.toLowerCase();
                // Skill appears in resume but not in experience section
                if (fullText.includes(skillLower) && !experienceText.includes(skillLower)) {
                    skillsOnly.push(skill);
                }
            });
        }

        return skillsOnly;
    }

    /**
     * Count vague descriptions
     */
    countVagueDescriptions(experiences) {
        const vaguePatterns = [
            /responsible for/i,
            /worked on/i,
            /involved in/i,
            /participated in/i,
            /helped with/i,
            /assisted in/i
        ];

        let count = 0;
        experiences.forEach(exp => {
            if (exp.description) {
                vaguePatterns.forEach(pattern => {
                    if (pattern.test(exp.description)) {
                        count++;
                    }
                });
            }
        });

        return count;
    }

    /**
     * Detect buzzwords without context
     */
    detectBuzzwordsWithoutContext(resumeData) {
        const buzzwords = [
            'innovative', 'passionate', 'team player', 'hard-working',
            'detail-oriented', 'results-driven', 'dynamic', 'synergy',
            'leverage', 'paradigm', 'strategic', 'thought leader'
        ];

        const found = [];
        const text = (resumeData.rawText || '').toLowerCase();

        buzzwords.forEach(word => {
            if (text.includes(word.toLowerCase())) {
                // Check if it's backed by evidence (near numbers or action verbs)
                const pattern = new RegExp(`${word}.{0,100}(\\d+%|\\d+ (projects?|users?|clients?)|developed|delivered|achieved)`, 'i');
                if (!pattern.test(text)) {
                    found.push(word);
                }
            }
        });

        return found;
    }

    /**
     * Check for quantifiable achievements
     */
    hasQuantifiableAchievements(resumeData) {
        const text = resumeData.rawText || '';
        const patterns = [
            /\d+%/,  // Percentages
            /\d+ (users?|projects?|clients?|engineers?|developers?)/i,  // Counts
            /\$\d+/,  // Money
            /\d+x/  // Multipliers
        ];

        return patterns.some(pattern => pattern.test(text));
    }

    /**
     * Detect experience gaps (simplified)
     */
    detectExperienceGap(resumeData) {
        if (!resumeData.experience || resumeData.experience.length < 2) {
            return false;
        }

        // Check if any experience entry mentions gap-related terms
        const gapTerms = ['gap', 'break', 'sabbatical', 'hiatus'];
        const text = (resumeData.rawText || '').toLowerCase();

        return !gapTerms.some(term => text.includes(term)) &&
            resumeData.experience.length >= 2 &&
            resumeData.totalYearsExperience < 3;
    }
}

module.exports = new RiskFlagDetector();
