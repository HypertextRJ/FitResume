const rejectionAnalyzer = require('./rejectionAnalyzer');
const improvementSuggester = require('./improvementSuggester');
const skillEvidenceAnalyzer = require('./skillEvidenceAnalyzer');
const readinessMeter = require('./readinessMeter');
const riskFlagDetector = require('./riskFlagDetector');
const dualViewGenerator = require('./dualViewGenerator');
const checklistGenerator = require('./checklistGenerator');

/**
 * Advanced Insights Orchestrator
 * 
 * Aggregates all advanced ATS features into a single cohesive response
 */
class AdvancedInsights {
    /**
     * Generate all advanced insights
     * 
     * @param {Object} matchResult - The core scoring result
     * @param {Object} resumeData - Parsed resume data
     * @param {Object} jdData - Parsed JD data
     * @returns {Object} Combined advanced insights
     */
    generateInsights(matchResult, resumeData, jdData) {
        // 1. Analyze rejection reasons
        const rejectionReasons = rejectionAnalyzer.analyzeRejectionReasons(matchResult, jdData);

        // 2. Generate improvement suggestions
        const suggestions = improvementSuggester.generateSuggestions(matchResult, jdData, resumeData);

        // 3. Analyze skill evidence (needed for other features)
        const matchedSkills = matchResult.breakdown.requiredSkills ?
            matchResult.breakdown.requiredSkills.matchedSkills : [];
        const missingSkills = matchResult.breakdown.requiredSkills ?
            matchResult.breakdown.requiredSkills.missingSkills : [];

        // Debug logging to understand what's happening
        console.log('🔍 Skill Evidence Debug:', {
            hasRequiredSkills: !!matchResult.breakdown.requiredSkills,
            totalRequired: matchResult.breakdown.requiredSkills?.totalRequired || 0,
            matchedCount: matchedSkills.length,
            missingCount: missingSkills.length
        });

        // Analyze evidence for matched skills AND mark missing skills as MISSING evidence
        const skillEvidence = skillEvidenceAnalyzer.analyzeSkillEvidence(matchedSkills, resumeData, missingSkills);
        const evidenceSummary = skillEvidenceAnalyzer.generateSummary(skillEvidence);

        // 4. Detect risk flags
        const riskFlags = riskFlagDetector.detectRiskFlags(matchResult, resumeData, jdData);

        // 5. Calculate readiness meter
        const readiness = readinessMeter.calculateReadiness(matchResult, resumeData, evidenceSummary);

        // 6. Generate dual views
        const dualViews = dualViewGenerator.generateDualViews(matchResult, resumeData, jdData);

        // 7. Generate checklist
        const checklist = checklistGenerator.generateChecklist(matchResult, resumeData, suggestions, riskFlags);
        const checklistSummary = checklistGenerator.generateSummary(checklist);

        return {
            whyAtsMayReject: {
                reasons: rejectionReasons,
                summary: rejectionAnalyzer.generateRejectionSummary(rejectionReasons)
            },
            improvementSuggestions: suggestions,
            skillEvidence: {
                details: skillEvidence,
                summary: evidenceSummary
            },
            readinessMeter: readiness,
            riskFlags: riskFlags,
            dualViews: dualViews,
            checklist: {
                items: checklist,
                summary: checklistSummary
            }
        };
    }
}

module.exports = new AdvancedInsights();
