/**
 * Semantic Similarity Normalization System
 * 
 * Philosophy: Prevent score inflation from raw cosine similarity
 * 
 * Problem: Raw similarity scores (0.0-1.0) can exaggerate relevance
 * Solution: Strict tiered mapping with NO rounding up, NO bonuses
 */

/**
 * Normalization Tiers
 * 
 * | Cosine Similarity | Max Points | Interpretation |
 * |-------------------|------------|----------------|
 * | < 0.35            | 0          | Not relevant   |
 * | 0.35 - 0.50       | 8          | Low relevance  |
 * | 0.50 - 0.65       | 15         | Medium         |
 * | 0.65 - 0.80       | 22         | High           |
 * | > 0.80            | 25         | Exceptional    |
 */

const SIMILARITY_TIERS = {
    EXCEPTIONAL: { min: 0.80, max: 1.00, maxPoints: 25 },
    HIGH: { min: 0.65, max: 0.80, maxPoints: 22 },
    MEDIUM: { min: 0.50, max: 0.65, maxPoints: 15 },
    LOW: { min: 0.35, max: 0.50, maxPoints: 8 },
    NONE: { min: 0.00, max: 0.35, maxPoints: 0 }
};

/**
 * Normalize cosine similarity to points (0-25)
 * 
 * Formula per tier:
 * points = ((similarity - tier_min) / (tier_max - tier_min)) * tier_maxPoints
 * 
 * @param {number} similarity - Cosine similarity (0.0 to 1.0)
 * @param {number} maxPoints - Maximum points possible (default 25)
 * @returns {Object} { points, tier, similarity, explanation }
 */
function normalizeSimilarity(similarity, maxPoints = 25) {
    // Clamp similarity to valid range
    const sim = Math.max(0.0, Math.min(1.0, similarity));

    let tier, tierInfo;

    // Determine tier
    if (sim >= SIMILARITY_TIERS.EXCEPTIONAL.min) {
        tier = 'EXCEPTIONAL';
        tierInfo = SIMILARITY_TIERS.EXCEPTIONAL;
    } else if (sim >= SIMILARITY_TIERS.HIGH.min) {
        tier = 'HIGH';
        tierInfo = SIMILARITY_TIERS.HIGH;
    } else if (sim >= SIMILARITY_TIERS.MEDIUM.min) {
        tier = 'MEDIUM';
        tierInfo = SIMILARITY_TIERS.MEDIUM;
    } else if (sim >= SIMILARITY_TIERS.LOW.min) {
        tier = 'LOW';
        tierInfo = SIMILARITY_TIERS.LOW;
    } else {
        tier = 'NONE';
        tierInfo = SIMILARITY_TIERS.NONE;
    }

    // Calculate points within tier (linear interpolation)
    let points;

    if (tier === 'NONE') {
        points = 0;
    } else {
        const tierRange = tierInfo.max - tierInfo.min;
        const positionInTier = sim - tierInfo.min;
        const tierProgress = positionInTier / tierRange;

        // Scale to tier's max points
        const tierMaxPoints = tierInfo.maxPoints;
        points = tierProgress * tierMaxPoints;

        // Apply overall scaling if maxPoints != 25
        if (maxPoints !== 25) {
            points = (points / 25) * maxPoints;
        }
    }

    // Floor the result (NO rounding up)
    points = Math.floor(points * 100) / 100; // Keep 2 decimal places

    return {
        points: points,
        similarity: sim,
        tier: tier,
        tierMaxPoints: tierInfo.maxPoints,
        explanation: getExplanation(sim, tier, points, maxPoints)
    };
}

/**
 * Get human-readable explanation
 */
function getExplanation(similarity, tier, points, maxPoints) {
    const percentage = Math.round(similarity * 100);

    const tierLabels = {
        'EXCEPTIONAL': 'Exceptional match',
        'HIGH': 'High relevance',
        'MEDIUM': 'Medium relevance',
        'LOW': 'Low relevance',
        'NONE': 'Not relevant'
    };

    const label = tierLabels[tier];

    if (tier === 'NONE') {
        return `${percentage}% similarity - ${label} - No points awarded`;
    }

    return `${percentage}% similarity - ${label} - ${points.toFixed(1)}/${maxPoints} points`;
}

/**
 * Batch normalize multiple similarities
 */
function normalizeBatch(similarities, maxPoints = 25) {
    return similarities.map(sim => normalizeSimilarity(sim, maxPoints));
}

/**
 * Get tier for a similarity score (useful for display)
 */
function getTier(similarity) {
    const sim = Math.max(0.0, Math.min(1.0, similarity));

    if (sim >= 0.80) return 'EXCEPTIONAL';
    if (sim >= 0.65) return 'HIGH';
    if (sim >= 0.50) return 'MEDIUM';
    if (sim >= 0.35) return 'LOW';
    return 'NONE';
}

/**
 * Example conversions for testing/documentation
 */
function getExamples() {
    const testSimilarities = [
        0.95, 0.85, 0.75, 0.70, 0.60, 0.55, 0.45, 0.40, 0.30, 0.20, 0.10
    ];

    return testSimilarities.map(sim => normalizeSimilarity(sim, 25));
}

module.exports = {
    normalizeSimilarity,
    normalizeBatch,
    getTier,
    getExamples,
    SIMILARITY_TIERS
};
