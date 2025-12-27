/**
 * Checklist Generator
 * 
 * Creates actionable "Before You Apply" checklist
 * Binary items derived from analysis
 */

class ChecklistGenerator {
    /**
     * Generate checklist
     * @param {Object} matchResult - Match result
     * @param {Object} resumeData - Resume data
     * @param {Array} improvementSuggestions - From suggester
     * @param {Array} riskFlags - From detector
     * @returns {Array} Checklist items
     */
    generateChecklist(matchResult, resumeData, improvementSuggestions, riskFlags) {
        const items = [];

        // Item 1: Required skills coverage
        if (matchResult.breakdown.requiredSkills) {
            const { missingSkills, totalRequired } = matchResult.breakdown.requiredSkills;
            const coverage = ((totalRequired - missingSkills.length) / totalRequired) * 100;

            items.push({
                item: 'Address missing required skills',
                status: coverage >= 80 ? 'DONE' : 'TODO',
                description: coverage >= 80 ?
                    `✓ ${Math.round(coverage)}% of required skills covered` :
                    `Add or highlight ${missingSkills.length} missing required skills`,
                priority: coverage < 50 ? 'CRITICAL' : coverage < 80 ? 'HIGH' : 'LOW'
            });
        }

        // Item 2: Experience clarity
        const hasExperienceDates = resumeData.experience &&
            resumeData.experience.some(exp => exp.duration || exp.company);

        items.push({
            item: 'Show clear work history with dates',
            status: hasExperienceDates ? 'DONE' : 'TODO',
            description: hasExperienceDates ?
                '✓ Experience includes dates and companies' :
                'Add dates and durations to all work experience',
            priority: 'HIGH'
        });

        // Item 3: Skills in context
        const skillsNeedEvidence = riskFlags.some(f => f.flag === 'Skills without evidence');

        items.push({
            item: 'Demonstrate skills in projects/experience',
            status: !skillsNeedEvidence ? 'DONE' : 'TODO',
            description: !skillsNeedEvidence ?
                '✓ Skills backed by project examples' :
                'Show how you used key skills in actual projects',
            priority: 'HIGH'
        });

        // Item 4: Match JD terminology
        if (matchResult.breakdown.keywordDensity) {
            const hasGoodKeywordMatch = matchResult.breakdown.keywordDensity.density >= 0.5;

            items.push({
                item: 'Use terminology from job description',
                status: hasGoodKeywordMatch ? 'DONE' : 'TODO',
                description: hasGoodKeywordMatch ?
                    '✓ Good keyword alignment with job description' :
                    'Incorporate job-specific terms in your experience section',
                priority: 'MEDIUM'
            });
        }

        // Item 5: Quantifiable achievements
        const hasMetrics = resumeData.rawText &&
            /\d+%|\d+ (users?|projects?|clients?)/i.test(resumeData.rawText);

        items.push({
            item: 'Add measurable achievements',
            status: hasMetrics ? 'DONE' : 'TODO',
            description: hasMetrics ?
                '✓ Resume includes quantifiable results' :
                'Add numbers, percentages, or measurable outcomes',
            priority: 'MEDIUM'
        });

        // Item 6: Education requirement
        if (matchResult.breakdown.education && matchResult.breakdown.education.required) {
            const meetsEducation = matchResult.breakdown.education.points >= 12;

            items.push({
                item: 'Meet education requirement',
                status: meetsEducation ? 'DONE' : 'TODO',
                description: meetsEducation ?
                    `✓ Meets ${matchResult.breakdown.education.required}` :
                    `Ensure ${matchResult.breakdown.education.required} is clearly shown`,
                priority: 'CRITICAL'
            });
        }

        // Item 7: Avoid vague descriptions
        const hasVagueDescriptions = riskFlags.some(f => f.flag === 'Vague role descriptions');

        items.push({
            item: 'Replace vague phrases with specific achievements',
            status: !hasVagueDescriptions ? 'DONE' : 'TODO',
            description: !hasVagueDescriptions ?
                '✓ Clear, specific descriptions' :
                'Replace "responsible for" with concrete actions and results',
            priority: 'MEDIUM'
        });

        // Sort by priority
        const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        items.sort((a, b) => {
            // TODO items first, then by priority
            if (a.status !== b.status) {
                return a.status === 'TODO' ? -1 : 1;
            }
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        return items;
    }

    /**
     * Generate summary
     */
    generateSummary(checklist) {
        const total = checklist.length;
        const done = checklist.filter(item => item.status === 'DONE').length;
        const todo = total - done;

        return {
            total,
            done,
            todo,
            readiness: Math.round((done / total) * 100),
            message: todo === 0 ?
                'Resume is ready to submit!' :
                `${todo} item${todo > 1 ? 's' : ''} to address before applying`
        };
    }
}

module.exports = new ChecklistGenerator();
