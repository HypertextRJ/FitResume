/**
 * Skill Evidence Analyzer
 * 
 * Checks strength of skill evidence in resume
 * Prevents keyword stuffing detection
 */

class SkillEvidenceAnalyzer {
    /**
     * Analyze evidence strength for matched skills AND missing skills
     * @param {Array} matchedSkills - Skills that were matched
     * @param {Object} resumeData - Full resume data with sections
     * @param {Array} missingSkills - Skills that were not found in resume (optional)
     * @returns {Array} Evidence analysis for each skill
     */
    analyzeSkillEvidence(matchedSkills, resumeData, missingSkills = []) {
        const evidenceReport = [];
        const resumeText = resumeData.rawText || '';

        // Extract sections
        const sections = this.extractSections(resumeText);

        // Check if we have valid sections
        const hasSections = sections.experience.length > 50 || sections.projects.length > 50;

        matchedSkills.forEach(match => {
            const skillName = match.matchedAs || match.skill;
            const evidence = this.checkSkillEvidence(skillName, sections, hasSections);
            evidenceReport.push(evidence);
        });

        // Add missing skills as MISSING evidence
        missingSkills.forEach(skill => {
            evidenceReport.push({
                skill: skill,
                strength: 'MISSING',
                verdict: 'Not found in resume',
                hasContextualUsage: false,
                recommendation: `Add ${skill} to your resume - it's a required skill`
            });
        });

        return evidenceReport;
    }

    /**
     * Extract resume sections
     */
    extractSections(text) {
        const lowerText = text.toLowerCase();

        // Find section boundaries
        const skillsStart = lowerText.search(/\b(skills?|technical skills?|core competencies)\b/);
        const experienceStart = lowerText.search(/\b(experience|work history|employment|professional experience)\b/);
        const projectsStart = lowerText.search(/\b(projects?|key projects?)\b/);

        return {
            skills: skillsStart >= 0 ? text.substring(skillsStart, experienceStart >= 0 ? experienceStart : text.length) : '',
            experience: experienceStart >= 0 ? text.substring(experienceStart, text.length) : '',
            projects: projectsStart >= 0 ? text.substring(projectsStart, text.length) : '',
            full: text
        };
    }

    /**
     * Check evidence for a single skill
     */
    checkSkillEvidence(skillName, sections, hasSections) {
        if (!skillName || typeof skillName !== 'string') return this.getEmptyEvidence(skillName);

        const skillLower = skillName.toLowerCase();
        const safeSkill = this.escapeRegExp(skillLower);
        const skillRegex = new RegExp(`\\b${safeSkill}\\b`, 'i');

        // Check occurrences
        const inSkills = sections.skills ? skillRegex.test(sections.skills) : false;
        const inExperience = sections.experience ? skillRegex.test(sections.experience) : false;
        const inProjects = sections.projects ? skillRegex.test(sections.projects) : false;

        // Fallback: Check full text if not found in sections
        // If the matcher passed this skill, it MUST be in the full text.
        // We trust the matcher's judgment that the skill exists.
        const inFullText = sections.full ? skillRegex.test(sections.full) : false;

        let strength = 'MISSING';
        let verdict = 'Not found in parsed sections';
        let recommendation = `Explicitly mention ${skillName} in your experience`;

        if (inExperience || inProjects) {
            // BEST CASE: Found in work/projects
            // Check context
            const contextText = (sections.experience || '') + ' ' + (sections.projects || '');
            const hasContext = this.hasContextualEvidence(skillName, contextText);

            strength = 'STRONG';
            verdict = hasContext ? 'Demonstrated with action verbs' : 'Found in Experience/Projects';
            recommendation = null;
        } else if (inSkills) {
            // OK CASE: Found in list
            strength = 'WEAK';
            verdict = 'Listed in Skills section only';
            recommendation = `Add ${skillName} to a project description to prove hands-on experience`;
        } else if (inFullText || !hasSections) {
            // FALLBACK CASE: Matcher found it, but we can't place it in a section
            // likely because section parsing failed or it's in Summary/Header
            strength = 'MODERATE';
            verdict = 'Found in resume (Section Unclear)';
            recommendation = 'Ensure this skill is clearly listed in Work History';
        }

        return {
            skill: skillName,
            strength,
            verdict,
            hasContextualUsage: strength === 'STRONG',
            recommendation
        };
    }

    getEmptyEvidence(name) {
        return { skill: name, strength: 'MISSING', verdict: 'Invalid', recommendation: null };
    }

    /**
     * Check if skill appears near action verbs (contextual evidence)
     */
    hasContextualEvidence(skillName, experienceText) {
        const actionVerbs = [
            'developed', 'designed', 'built', 'implemented', 'created',
            'engineered', 'architected', 'delivered', 'deployed', 'managed',
            'led', 'optimized', 'improved', 'maintained', 'integrated',
            'configured', 'automated', 'migrated', 'scaled', 'debugged'
        ];

        const skillLower = skillName.toLowerCase();
        const textLower = experienceText.toLowerCase();

        // Create regex to find skill near action verb (within 50 chars)
        for (const verb of actionVerbs) {
            const pattern = new RegExp(`${verb}.{0,50}${skillLower}|${skillLower}.{0,50}${verb}`, 'i');
            if (pattern.test(textLower)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate summary stats
     */
    generateSummary(evidenceReport) {
        if (!evidenceReport || !Array.isArray(evidenceReport)) {
            return {
                strong: 0,
                moderate: 0,
                weak: 0,
                missing: 0,
                total: 0,
                overallStrength: 'WEAK'
            };
        }

        const strong = evidenceReport.filter(e => e && e.strength === 'STRONG').length;
        const moderate = evidenceReport.filter(e => e && e.strength === 'MODERATE').length;
        const weak = evidenceReport.filter(e => e && e.strength === 'WEAK').length;
        const missing = evidenceReport.filter(e => e && e.strength === 'MISSING').length;

        const total = evidenceReport.length;

        // Safe strength calculation
        let overallStrength = 'WEAK';
        if (total > 0) {
            if (strong >= total * 0.6) overallStrength = 'STRONG';
            else if ((strong + moderate) >= total * 0.5) overallStrength = 'MODERATE';
        }

        return {
            strong,
            moderate,
            weak,
            missing,
            total,
            overallStrength
        };
    }

    /**
     * Escape special characters for RegExp
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = new SkillEvidenceAnalyzer();
