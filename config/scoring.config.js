/**
 * Scoring Configuration
 * 
 * PHILOSOPHY: HARSH, REALISTIC, JOB-SPECIFIC
 * - 90+ scores should be EXTREMELY rare
 * - Missing requirements = heavy penalties
 * - NO FREE POINTS for missing data
 * - Irrelevant resumes should score < 20%
 */

module.exports = {
  // Category weights (must total 100)
  WEIGHTS: {
    REQUIRED_SKILLS: 35,      // Increased from 30 - most critical
    EXPERIENCE: 25,            // Same
    EDUCATION: 15,             // Same
    PREFERRED_SKILLS: 10,      // Reduced from 15
    KEYWORD_DENSITY: 10,       // Same
    FORMAT_CLARITY: 5          // Same
  },

  // Required Skills Scoring (35 points max)
  REQUIRED_SKILLS: {
    POINTS_PER_SKILL: 7,       // Increased from 6 (35/5 avg skills)
    MIN_SIMILARITY: 0.4,       // Minimum similarity for partial credit
    PARTIAL_MATCH_CREDIT: 0.3, // Reduced from 0.5 - max 30% credit for partial

    // CRITICAL: If NO required skills in JD, give 0 points (not full points!)
    NO_REQUIREMENTS_POINTS: 0  // Was giving maxPoints before
  },

  // Experience Scoring (25 points max)
  EXPERIENCE: {
    PENALTIES: {
      SHORT_0_2_YEARS: 8,        // Increased from 5
      SHORT_2_4_YEARS: 15,       // Increased from 10
      SHORT_4_PLUS_YEARS: 25,    // Full penalty - completely unqualified
      OVER_QUALIFIED_5_PLUS: 5   // Same - slight penalty
    },

    // CRITICAL: If NO experience requirement, give 0 points (not full points!)
    NO_REQUIREMENT_POINTS: 0  // Was giving maxPoints before
  },

  // Education Scoring (15 points max)
  EDUCATION: {
    EXACT_MATCH: 15,           // Same
    LOWER_DEGREE: 5,           // Reduced from 8
    MISSING_REQUIRED: 0,       // Same

    // CRITICAL: If NO education requirement, give 0 points (not full points!)
    NO_REQUIREMENT_POINTS: 0  // Was giving maxPoints before
  },

  // Preferred Skills (10 points max)
  PREFERRED_SKILLS: {
    POINTS_PER_SKILL: 2,       // 10 points / 5 skills
    MAX_SKILLS_COUNTED: 5      // Same
  },

  // Keyword Density (10 points max)
  KEYWORD_DENSITY: {
    EXCELLENT_THRESHOLD: 0.7,  // Same - 70%+ match
    GOOD_THRESHOLD: 0.5,       // Same - 50-69%
    FAIR_THRESHOLD: 0.3,       // Same - 30-49%
    POOR_THRESHOLD: 0.15,      // Same - 15-29%

    POINTS: {
      EXCELLENT: 10,         // Same
      GOOD: 7,              // Same
      FAIR: 4,              // Reduced from 5
      POOR: 2,              // Reduced from 3
      VERY_POOR: 0          // Same - < 15% = 0 points
    }
  },

  // Format & Clarity
  FORMAT: {
    PERFECT: 5,
    MINOR_ISSUES: 3,
    MAJOR_ISSUES: 1,
    UNPARSEABLE: 0
  },

  // Score interpretation ranges
  SCORE_RANGES: {
    EXCEPTIONAL: { min: 90, max: 100, label: 'Exceptional Match', color: '#059669' },
    VERY_GOOD: { min: 76, max: 89, label: 'Very Good Match', color: '#10b981' },
    GOOD: { min: 61, max: 75, label: 'Good Match', color: '#fbbf24' },
    FAIR: { min: 41, max: 60, label: 'Fair Match', color: '#f59e0b' },
    POOR: { min: 0, max: 40, label: 'Poor Match', color: '#ef4444' }
  }
};

// Note: Validation removed - weights now checked at runtime if needed
