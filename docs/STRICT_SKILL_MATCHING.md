# Strict Skill Similarity System

## Philosophy: EXPLICIT > IMPLICIT

**Problem:** AI-driven similarity causes score inflation.  
**Solution:** Predefined similarity dictionary with FIXED weights.

---

## Core Rules

1. **Only predefined similarities allowed** - No AI inference
2. **Max partial credit: 50%** - Enforced programmatically
3. **Unrelated skills: 0%** - No guessing
4. **Bidirectional mappings** - A→B implies B→A

---

## Similarity Tiers

| Tier | Range | Meaning | Example |
|------|-------|---------|---------|
| **Exact** | 100% | Same skill or alias | React ↔ React.js |
| **Strong** | 70-90% | Same ecosystem/version | Spring ↔ Spring Boot |
| **Related** | 50-60% | Transferable concepts | MySQL ↔ PostgreSQL |
| **Weak** | 30-40% | Same category, different tech | AWS ↔ Azure |
| **Minimal** | 10-20% | Loosely related | SQL ↔ NoSQL |
| **None** | 0% | Unrelated | Java ↔ JavaScript |

---

## Credit Calculation

```javascript
if (similarity === 1.0) {
  credit = 100%  // Full credit
} else if (similarity > 0) {
  credit = similarity × 50%  // STRICT CAP
} else {
  credit = 0%  // No credit
}
```

### Examples

| Required Skill | Resume Skill | Similarity | Credit | Points (if 6pts per skill) |
|----------------|--------------|------------|--------|----------------------------|
| React | React | 100% | 100% | 6.0 pts |
| React | Next.js | 60% | **30%** | **1.8 pts** |
| MySQL | PostgreSQL | 50% | **25%** | **1.5 pts** |
| React | Angular | 40% | **20%** | **1.2 pts** |
| Java | JavaScript | 0% | **0%** | **0 pts** |

**Notice:** Even 60% similarity only gives 30% credit (not 60%)!

---

## Predefined Mappings (Sample)

### Frameworks
```
Spring → Spring Boot: 70%
React → Next.js: 60%
Angular → AngularJS: 40%
Django → Flask: 40%
```

### Databases
```
MySQL → PostgreSQL: 50%
MySQL → MariaDB: 70%
MongoDB → CouchDB: 30%
SQL → NoSQL: 20%  ← Fundamentally different
```

### Languages
```
JavaScript → TypeScript: 60%
Python 2 → Python 3: 70%
Java → Kotlin: 40%
Java → JavaScript: 0%  ← EXPLICITLY ZERO
```

### Cloud
```
AWS → Azure: 40%
AWS → GCP: 40%
Docker → Kubernetes: 50%
```

---

## Example Evaluation

### Scenario
**Required Skills:**
- React
- Node.js
- PostgreSQL
- Docker

**Resume Skills:**
- Next.js
- Express
- MySQL
- Kubernetes

### Scoring

| Required | Found | Similarity | Credit | Calculation |
|----------|-------|------------|--------|-------------|
| React | Next.js | 60% | 30% | 60% × 50% = 30% |
| Node.js | Express | 60% | 30% | 60% × 50% = 30% |
| PostgreSQL | MySQL | 50% | 25% | 50% × 50% = 25% |
| Docker | Kubernetes | 50% | 25% | 50% × 50% = 25% |

**Total:** 27.5% credit (4 required skills, only partial matches)

**Points:** If each skill = 6pts, total = 6.6 pts out of 24 pts

**Harsh but fair!**

---

## User-Facing Explanations

### Exact Match
```
✅ React - Exact match found
```

### Partial Match (Strong)
```
⚡ Node.js - Strong related skill: Express (60% similar) - Partial credit given
```

### Partial Match (Weak)
```
⚠️ React - Weakly related: Angular (40% similar) - Minimal credit given
```

### No Match
```
❌ Docker - Not found in resume - No credit
```

---

## Strict Enforcement

### What AI CANNOT Do

❌ Invent new similarities  
❌ Override predefined scores  
❌ Give >50% credit for partial matches  
❌ Match unrelated skills

### What System DOES

✅ Uses only predefined dictionary  
✅ Enforces 50% cap programmatically  
✅ Returns 0% for undefined pairs  
✅ Provides clear explanations

---

## Adding New Mappings

Edit: `config/skillSimilarity.js`

```javascript
SKILL_SIMILARITY = {
  'your-skill': {
    'related-skill': 0.60,  // 60% similarity
    'another-skill': 0.40
  }
}
```

**Guidelines:**
- **70-90%**: Same ecosystem (Spring → Spring Boot)
- **50-60%**: Transferable (MySQL → PostgreSQL)
- **30-40%**: Same category (AWS → Azure)
- **0%**: Unrelated (Java → JavaScript)

**Remember:** User only gets `similarity × 50%` credit!

---

## Testing Examples

### Test Case 1: JD requires "React"

| Resume Has | Result |
|------------|--------|
| React | ✅ 100% (6 pts) |
| Next.js | ⚡ 30% (1.8 pts) |
| Angular | ⚠️ 20% (1.2 pts) |
| Vue | ⚠️ 0% (0 pts - not in dictionary) |

### Test Case 2: JD requires "Spring"

| Resume Has | Result |
|------------|--------|
| Spring Boot | ⚡ 35% (0.70 × 50% = 35%) |
| Java | ⚠️ 0% (not similar) |
| Django | ⚠️ 0% (different language) |

---

## Impact on Scores

**Before (with AI similarity):**
- Resume with Next.js for React requirement: ~80-90% credit
- **Score inflation!**

**After (with strict rules):**
- Resume with Next.js for React requirement: 30% credit
- **Realistic assessment!**

This ensures **90+ scores remain rare** as intended.

---

## Summary

✅ **Predefined dictionary** - 100+ skill mappings  
✅ **Fixed weights** - No AI interpretation  
✅ **50% max partial credit** - Strict cap enforced  
✅ **Clear explanations** - Users understand why  
✅ **No score inflation** - Maintains system integrity
