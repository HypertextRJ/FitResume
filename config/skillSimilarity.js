/**
 * STRICT Skill Similarity Dictionary
 * 
 * Philosophy: EXPLICIT > IMPLICIT
 * - Only predefined similarities are allowed
 * - No AI-driven similarity detection
 * - Max partial credit: 50% (enforced)
 * - Unrelated skills: 0% credit
 * 
 * Rules:
 * 1. Similarity scores are FIXED, not negotiable
 * 2. AI cannot override these mappings
 * 3. If not in dictionary, similarity = 0%
 * 4. Bidirectional mappings (A→B implies B→A)
 */

const SKILL_SIMILARITY = {
    // ========================================
    // FRAMEWORKS & LIBRARIES
    // ========================================

    // Spring Framework Family (70% - same ecosystem)
    'spring': {
        'spring boot': 0.70,
        'spring mvc': 0.70,
        'spring framework': 0.90
    },
    'spring boot': {
        'spring': 0.70,
        'spring mvc': 0.60
    },

    // React Ecosystem (60-70% - related libraries)
    'react': {
        'react.js': 1.0,  // Exact aliases
        'reactjs': 1.0,
        'next.js': 0.60,   // Built on React
        'gatsby': 0.50,
        'preact': 0.50
    },
    'next.js': {
        'react': 0.60,
        'nextjs': 1.0
    },

    // Angular Family (70% - version evolution)
    'angular': {
        'angularjs': 0.40,  // Different architecture
        'angular.js': 0.40,
        'angular 2+': 0.90
    },

    // Vue Ecosystem (60% - related)
    'vue': {
        'vue.js': 1.0,
        'vuejs': 1.0,
        'nuxt': 0.60,
        'nuxt.js': 0.60
    },

    // ========================================
    // BACKEND FRAMEWORKS
    // ========================================

    // Node.js Ecosystem (60-70%)
    'node.js': {
        'nodejs': 1.0,
        'express': 0.60,
        'express.js': 0.60,
        'nestjs': 0.50,
        'koa': 0.50
    },
    'express': {
        'express.js': 1.0,
        'node.js': 0.60,
        'koa': 0.40,
        'fastify': 0.40
    },

    // Python Frameworks (50-60%)
    'django': {
        'python': 0.60,
        'flask': 0.40,  // Different philosophy
        'fastapi': 0.40
    },
    'flask': {
        'python': 0.60,
        'django': 0.40,
        'fastapi': 0.50
    },
    'fastapi': {
        'python': 0.60,
        'flask': 0.50,
        'django': 0.40
    },

    // ========================================
    // DATABASES
    // ========================================

    // SQL Databases (50% - transferable but different)
    'mysql': {
        'postgresql': 0.50,
        'mariadb': 0.70,  // MySQL fork
        'sql': 0.60
    },
    'postgresql': {
        'mysql': 0.50,
        'postgres': 1.0,
        'sql': 0.60
    },
    'sql server': {
        'mysql': 0.40,
        'postgresql': 0.40,
        'sql': 0.60
    },

    // NoSQL Databases (30-40% - different paradigms)
    'mongodb': {
        'nosql': 0.60,
        'couchdb': 0.30,
        'dynamodb': 0.30
    },
    'redis': {
        'memcached': 0.50,
        'nosql': 0.40
    },

    // SQL vs NoSQL (20% - fundamentally different)
    'sql': {
        'nosql': 0.20,
        'mysql': 0.60,
        'postgresql': 0.60
    },
    'nosql': {
        'sql': 0.20,
        'mongodb': 0.60
    },

    // ========================================
    // PROGRAMMING LANGUAGES
    // ========================================

    // Language Evolution (70% - newer versions)
    'python 2': {
        'python': 0.70,
        'python 3': 0.70
    },
    'python 3': {
        'python': 0.90,
        'python 2': 0.70
    },

    // Java Ecosystem (50-60%)
    'java': {
        'java 8': 0.80,
        'java 11': 0.80,
        'kotlin': 0.40,  // JVM but different
        'scala': 0.30
    },
    'kotlin': {
        'java': 0.40,
        'android': 0.60
    },

    // JavaScript Family (30-40% - related but distinct)
    'javascript': {
        'js': 1.0,
        'typescript': 0.60,
        'ecmascript': 0.90
    },
    'typescript': {
        'javascript': 0.70,
        'ts': 1.0
    },

    // C Family (30-40% - syntax similar, purpose different)
    'c++': {
        'c': 0.40,
        'cpp': 1.0
    },
    'c#': {
        'csharp': 1.0,
        '.net': 0.70,
        'c++': 0.20,  // Different despite name
        'c': 0.20
    },

    // ========================================
    // CLOUD PROVIDERS
    // ========================================

    // Cloud Platforms (40% - transferable concepts)
    'aws': {
        'amazon web services': 1.0,
        'azure': 0.40,
        'gcp': 0.40,
        'google cloud': 0.40
    },
    'azure': {
        'aws': 0.40,
        'gcp': 0.40,
        'microsoft azure': 1.0
    },
    'gcp': {
        'google cloud': 1.0,
        'google cloud platform': 1.0,
        'aws': 0.40,
        'azure': 0.40
    },

    // ========================================
    // DEVOPS & CONTAINERS
    // ========================================

    // Container Orchestration (50%)
    'kubernetes': {
        'k8s': 1.0,
        'docker': 0.50,  // Related but different
        'docker swarm': 0.40
    },
    'docker': {
        'kubernetes': 0.50,
        'containerization': 0.70
    },

    // CI/CD Tools (30-40% - same category)
    'jenkins': {
        'ci/cd': 0.60,
        'gitlab ci': 0.30,
        'github actions': 0.30
    },
    'gitlab ci': {
        'ci/cd': 0.60,
        'github actions': 0.40,
        'jenkins': 0.30
    },

    // ========================================
    // MOBILE DEVELOPMENT
    // ========================================

    // Mobile Platforms (20% - different ecosystems)
    'ios': {
        'swift': 0.70,
        'objective-c': 0.60,
        'android': 0.20  // Different platform
    },
    'android': {
        'kotlin': 0.70,
        'java': 0.60,
        'ios': 0.20
    },

    // Cross-platform (50% with native)
    'react native': {
        'react': 0.70,
        'flutter': 0.30,
        'ios': 0.40,
        'android': 0.40
    },
    'flutter': {
        'dart': 0.70,
        'react native': 0.30
    },

    // ========================================
    // ZERO SIMILARITY (Common Confusions)
    // ========================================
    // These are EXPLICITLY 0% to prevent confusion

    'java': {
        'javascript': 0.0  // NEVER similar despite name
    },
    'javascript': {
        'java': 0.0
    }
};

/**
 * Get similarity between two skills
 * @param {string} skill1 - First skill (required skill from JD)
 * @param {string} skill2 - Second skill (skill from resume)
 * @returns {number} Similarity score (0.0 to 1.0)
 */
function getSkillSimilarity(skill1, skill2) {
    const s1 = skill1.toLowerCase().trim();
    const s2 = skill2.toLowerCase().trim();

    // Exact match (case-insensitive)
    if (s1 === s2) {
        return 1.0;
    }

    // Check predefined dictionary
    if (SKILL_SIMILARITY[s1] && SKILL_SIMILARITY[s1][s2] !== undefined) {
        return SKILL_SIMILARITY[s1][s2];
    }

    // Check reverse mapping (bidirectional)
    if (SKILL_SIMILARITY[s2] && SKILL_SIMILARITY[s2][s1] !== undefined) {
        return SKILL_SIMILARITY[s2][s1];
    }

    // Check common variations (e.g., "react.js" vs "reactjs")
    const normalized1 = normalizeSkill(s1);
    const normalized2 = normalizeSkill(s2);

    if (normalized1 === normalized2) {
        return 1.0;
    }

    // No match found = 0% similarity
    return 0.0;
}

/**
 * Normalize skill name for matching
 * Handles common variations, abbreviations, and phrases
 */
function normalizeSkill(skill) {
    if (!skill || typeof skill !== 'string') return '';

    let normalized = skill.toLowerCase().trim();

    // Remove common suffixes/prefixes that don't change meaning
    const removals = [
        ' development',
        ' programming',
        ' language',
        ' framework',
        ' library',
        ' database',
        ' management',
        ' system',
        ' systems',
        ' skills',
        ' experience'
    ];

    removals.forEach(suffix => {
        normalized = normalized.replace(new RegExp(suffix + '$'), '');
    });

    // Common abbreviation expansions
    const abbreviations = {
        'oop': 'object-oriented',
        'oops': 'object-oriented',
        'dbms': 'database',
        'rdbms': 'relational database',
        'sql': 'structured query language',
        'nosql': 'non-relational database',
        'html': 'hypertext markup language',
        'css': 'cascading style sheets',
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'cpp': 'c++',
        'cs': 'c#',
        'aws': 'amazon web services',
        'gcp': 'google cloud platform',
        'ml': 'machine learning',
        'ai': 'artificial intelligence',
        'ci/cd': 'continuous integration',
        'api': 'application programming interface',
        'rest': 'representational state transfer',
        'json': 'javascript object notation',
        'xml': 'extensible markup language',
        'ui': 'user interface',
        'ux': 'user experience'
    };

    // Check if normalized skill is an abbreviation
    if (abbreviations[normalized]) {
        normalized = abbreviations[normalized];
    }

    // Common replacements
    const replacements = {
        'reactjs': 'react',
        'react.js': 'react',
        'nodejs': 'node',
        'node.js': 'node',
        'vuejs': 'vue',
        'vue.js': 'vue',
        'angularjs': 'angular',
        'angular.js': 'angular',
        'c sharp': 'c#',
        'csharp': 'c#',
        'cplusplus': 'c++',
        'c plus plus': 'c++',
        'javascript': 'javascript',
        'typescript': 'typescript',
        'mongodb': 'mongo',
        'postgresql': 'postgres',
        'mysql': 'mysql',
        'object oriented': 'object-oriented',
        'structured query': 'sql',
        'relational databases': 'relational database'
    };

    Object.keys(replacements).forEach(key => {
        if (normalized === key || normalized.includes(key)) {
            normalized = normalized.replace(key, replacements[key]);
        }
    });

    // Remove extra spaces, dots, dashes
    normalized = normalized
        .replace(/\./g, '')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return normalized;
}
/**
 * Get explanation for partial match
 */
function getPartialMatchExplanation(requiredSkill, foundSkill, similarity) {
    if (similarity === 1.0) {
        return `Exact match: ${foundSkill}`;
    } else if (similarity >= 0.7) {
        return `Strong related skill: ${foundSkill} (${Math.round(similarity * 100)}% similar to ${requiredSkill})`;
    } else if (similarity >= 0.5) {
        return `Related skill: ${foundSkill} (${Math.round(similarity * 100)}% similar to ${requiredSkill})`;
    } else if (similarity >= 0.3) {
        return `Weakly related: ${foundSkill} (${Math.round(similarity * 100)}% similar to ${requiredSkill})`;
    } else if (similarity > 0) {
        return `Minimally related: ${foundSkill} (${Math.round(similarity * 100)}% similar to ${requiredSkill})`;
    } else {
        return null; // Not related at all
    }
}

/**
 * Calculate skill match credit with STRICT rules
 * 
 * Rules enforced:
 * 1. Exact match = 100% credit
 * 2. Partial match = similarity * 50% (MAX)
 * 3. No match = 0% credit
 * 
 * @param {string} requiredSkill - Skill required in JD
 * @param {Array<string>} resumeSkills - Skills found in resume
 * @returns {Object} Match result
 */
function calculateSkillCredit(requiredSkill, resumeSkills) {
    const MAX_PARTIAL_CREDIT = 0.5; // 50% maximum for partial matches

    let bestMatch = {
        skill: null,
        similarity: 0.0,
        credit: 0.0,
        explanation: null
    };

    resumeSkills.forEach(resumeSkill => {
        const similarity = getSkillSimilarity(requiredSkill, resumeSkill);

        if (similarity > bestMatch.similarity) {
            let credit;

            if (similarity === 1.0) {
                // Exact match = full credit
                credit = 1.0;
            } else if (similarity > 0) {
                // Partial match = similarity * 50% (STRICT CAP)
                credit = similarity * MAX_PARTIAL_CREDIT;
            } else {
                // No match
                credit = 0.0;
            }

            bestMatch = {
                skill: resumeSkill,
                similarity: similarity,
                credit: credit,
                explanation: getPartialMatchExplanation(requiredSkill, resumeSkill, similarity)
            };
        }
    });

    return bestMatch;
}

module.exports = {
    SKILL_SIMILARITY,
    getSkillSimilarity,
    getPartialMatchExplanation,
    calculateSkillCredit,
    normalizeSkill
};
