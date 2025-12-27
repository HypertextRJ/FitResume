/**
 * Improvement Suggester
 * 
 * Generates JD-specific, line-level improvement suggestions
 * Does NOT rewrite resume automatically
 */

class ImprovementSuggester {
    /**
     * Generate improvement suggestions
     * @param {Object} matchResult - Match result from matcher
     * @param {Object} jdData - Job description data
     * @param {Object} resumeData - Resume data
     * @returns {Array} Improvement suggestions
     */
    generateSuggestions(matchResult, jdData, resumeData) {
        const suggestions = [];
        const { breakdown } = matchResult;

        // 1. Missing Required Skills (Granular)
        if (breakdown.requiredSkills && breakdown.requiredSkills.missingSkills) {
            breakdown.requiredSkills.missingSkills.forEach(skill => {
                suggestions.push({
                    type: 'MISSING_SKILL',
                    priority: 'CRITICAL',
                    item: skill,
                    location: 'Skills Section & Experience',
                    issue: `Missing ${skill}`,
                    action: `Add ${skill} to Skill list AND use in a project bullet`,
                    example: `Developed scalable components using ${skill} to optimize performance`,
                    impact: '+7 points'
                });
            });
        }

        // 2. Partial Matches (Granular)
        if (breakdown.requiredSkills && breakdown.requiredSkills.partialMatches) {
            breakdown.requiredSkills.partialMatches.slice(0, 3).forEach(partial => {
                suggestions.push({
                    type: 'PARTIAL_MATCH',
                    priority: 'HIGH',
                    item: partial.required,
                    location: 'Experience Descriptions',
                    issue: `Used "${partial.found}" instead of "${partial.required}"`,
                    action: `Rename "${partial.found}" to "${partial.required}" to match JD`,
                    example: `Change "Familiar with ${partial.found}" to "Proficient in ${partial.required}"`,
                    impact: 'Full credit'
                });
            });
        }

        // 3. Experience Gaps
        if (breakdown.experience && breakdown.experience.difference < -1) {
            suggestions.push({
                type: 'EXPERIENCE_GAP',
                priority: 'HIGH',
                item: 'Work History',
                location: 'Professional Experience',
                issue: `Short by ${Math.abs(breakdown.experience.difference)} years`,
                action: 'Ensure all relevant roles include clear start/end dates',
                example: 'Role | Company | Jan 2020 - Present (4 years)',
                impact: 'Reduce penalty'
            });
        }

        // 4. Keyword Optimization
        if (breakdown.keywordDensity && breakdown.keywordDensity.tier === 'POOR') {
            const topKeywords = jdData.keywords ? jdData.keywords.slice(0, 3) : ['industry terms'];
            suggestions.push({
                type: 'KEYWORDS',
                priority: 'MEDIUM',
                item: 'Domain Terms',
                location: 'Summary or Experience',
                issue: 'Low keyword match',
                action: `Weave in these terms: ${topKeywords.join(', ')}`,
                example: ` Delivered ${topKeywords[0]} solutions in a ${topKeywords[1] || 'agile'} environment`,
                impact: '+5 points'
            });
        }

        // 5. Impact/Metrics
        const hasVagueDescriptions = this.detectVagueDescriptions(resumeData.experience || []);
        if (hasVagueDescriptions) {
            suggestions.push({
                type: 'IMPACT',
                priority: 'MEDIUM',
                item: 'Achievements',
                location: 'Experience Bullets',
                issue: 'Vague descriptions found',
                action: 'Add numbers/metrics to prove impact',
                example: 'Reduced processing time by 30% using optimized queries',
                impact: 'High recruiter interest'
            });
        }

        return suggestions;
    }

    /**
     * Detect vague descriptions
     */
    detectVagueDescriptions(experiences) {
        const vaguePatterns = [
            /responsible for/i,
            /worked on/i,
            /involved in/i,
            /participated in/i,
            /helped with/i
        ];

        let vagueCount = 0;
        const totalDescriptions = experiences.reduce((acc, exp) => {
            return acc + (exp.description ? exp.description.split('.').length : 0);
        }, 0);

        experiences.forEach(exp => {
            if (exp.description) {
                vaguePatterns.forEach(pattern => {
                    if (pattern.test(exp.description)) {
                        vagueCount++;
                    }
                });
            }
        });

        return vagueCount > totalDescriptions * 0.3; // >30% vague = flag
    }
}

module.exports = new ImprovementSuggester();
