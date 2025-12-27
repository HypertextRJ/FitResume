# Context-Aware Keyword Density Scoring

## Problem: Keyword Stuffing

**Traditional keyword density:**
- Count keyword occurrences
- Divide by total keywords
- **Problem:** Easily gamed by repetition!

**Example of stuffing:**
```
Skills: Python, Python, Python, React, React, Node.js, Node.js, AWS, AWS
```

---

## Solution: Context > Frequency

Keywords get credit based on **WHERE and HOW** they appear, not just frequency.

---

## Scoring Rules

### Rule 1: Contextual Usage = Full Credit

**Keyword appears:**
- Near action verbs (`built`, `developed`, `implemented`)
- Inside experience/projects sections

**Example (Full Credit):**
```
EXPERIENCE
• Developed Python microservices using Django framework
• Built React dashboards for real-time analytics
```
✅ `Python` + `developed` = Full credit  
✅ `React` + `built` = Full credit

---

### Rule 2: Skills List Only = 50% Credit

**Keyword appears ONLY in skills section:**

**Example (Partial Credit):**
```
SKILLS
Python, JavaScript, Docker
```
⚡ Each keyword = 50% credit (not full)

---

### Rule 3: Repetition Cap

**Keyword appears 4+ times contextually:**
- Only first 3 occurrences count
- Beyond that = no extra credit

**Why:** Prevents repetitive stuffing in descriptions

---

### Rule 4: Stuffing Penalties

Detect obvious stuffing patterns and apply penalties:

| Pattern | Penalty | Example |
|---------|---------|---------|
| **6+ repetitions** | -10% per keyword | `Python` appears 8 times |
| **Skills-only spam** | -5% per keyword | `Docker` 4 times, all in skills |
| **Comma stuffing** | -15% | "Python, React, Node.js, Python, AWS" |

**Max penalty:** 50% (harsh but fair)

---

## Calculation Flow

```
For each JD keyword:
  1. Find in resume
  2. Check context:
     - In experience + near action verb → Full credit (1.0)
     - Only in skills list → Partial credit (0.5)
     - Not found → No credit (0.0)
  3. Cap at 3 contextual uses

Sum all credits → Base density
Detect stuffing patterns → Penalty
Adjusted density = Base - Penalty
Convert density → Points (0-10)
```

---

## Density → Points Mapping

| Adjusted Density | Points (out of 10) | Verdict |
|------------------|-------------------|---------|
| **70%+** | 10.0 | Excellent |
| **50-70%** | 7.0 | Good |
| **30-50%** | 4.0 | Fair |
| **15-30%** | 2.0 | Poor |
| **< 15%** | 0.0 | Very poor |

---

## Examples

### Example 1: Good Resume (No Stuffing)

**JD Keywords:** `Python`, `React`, `Docker`, `AWS`

**Resume:**
```
EXPERIENCE
Senior Developer | TechCorp
• Developed Python APIs using FastAPI framework
• Built React dashboards for monitoring
• Deployed applications using Docker containers

SKILLS
AWS, PostgreSQL, Git
```

**Analysis:**
- `Python`: In experience + action verb (`Developed`) → 1.0 credit
- `React`: In experience + action verb (`Built`) → 1.0 credit
- `Docker`: In experience + action verb (`Deployed`) → 1.0 credit
- `AWS`: Only in skills → 0.5 credit

**Score:**
- Total credit: 3.5 / 4 keywords = 87.5%
- Stuffing penalty: 0%
- Adjusted: 87.5%
- **Points: 10/10** ✅

---

### Example 2: Skills-Only Resume

**Resume:**
```
SKILLS
Python, React, Docker, AWS, Kubernetes, TypeScript
```

**Analysis:**
- All 4 keywords: Only in skills → 0.5 credit each
- Total credit: 2.0 / 4 = 50%
- Stuffing penalty: 0% (not repeated)
- **Points: 7/10** ⚡ (Reduced from potential 10)

---

### Example 3: Keyword Stuffing (Penalized)

**Resume:**
```
EXPERIENCE
Python developer experienced in Python. Built Python applications.
Used Python, React, Python frameworks. Python expert.

SKILLS  
Python, Python, React, Docker, Docker, AWS, Python
```

**Analysis:**
- `Python`: 7 occurrences
  - 3 contextual uses (capped) → 1.0 credit
  - But 7 total → **-10% stuffing penalty**
- `React`: 1 in experience → 1.0 credit
- `Docker`: 2 in skills only → -5% penalty
- `AWS`: 1 in skills → 0.5 credit

**Score:**
- Total credit: 3.5 / 4 = 87.5%
- Stuffing penalty: -25%
- Adjusted: 62.5%
- **Points: 7/10** ⚠️ (Penalized from 10!)

---

### Example 4: Severe Stuffing

**Resume:**
```
SKILLS
Python, JavaScript, React, Node.js, Docker, AWS,
Python, JavaScript, React, Node.js, Docker, AWS,
Python, JavaScript, React, Node.js, Docker, AWS
```

**Analysis:**
- All keywords repeated 3 times
- All in skills only
- Comma-separated list pattern

**Penalties:**
- -10% for 6+ repetitions (×4 keywords) = -40%
- -15% for comma stuffing = -15%
- **Total penalty: -50% (capped)**

**Score:**
- Total credit: 2.0 / 4 = 50% (skills only)
- Stuffing penalty: -50%
- Adjusted: 0%
- **Points: 0/10** ❌ (Completely penalized!)

---

## Integration

### Replace Basic Keyword Scoring

**In `engine/matcher.js`:**

```javascript
const keywordScorer = require('../utils/keywordDensityScorer');

scoreKeywordDensity(resumeData, jdData) {
  const keywords = jdData.keywords || [];
  const result = keywordScorer.scoreKeywordDensity(
    resumeData.rawText, 
    keywords, 
    10 // max points
  );
  
  return {
    points: result.points,
    maxPoints: result.maxPoints,
    density: result.density,
    verdict: result.verdict,
    contextualMatches: result.contextualMatches,
    skillsOnlyMatches: result.skillsOnlyMatches,
    stuffingPenalty: result.stuffingPenalty
  };
}
```

---

## Action Verbs Detected

70+ action verbs recognized:
- **Achievement:** achieved, accomplished, delivered
- **Creation:** built, developed, designed, implemented
- **Leadership:** led, managed, mentored
- **Improvement:** optimized, enhanced, automated
- **More...**

---

## Summary

✅ **Context matters** - Keywords near action verbs = full credit  
✅ **Skills-only penalty** - Only 50% credit  
✅ **Repetition capped** - Max 3 contextual uses  
✅ **Stuffing detected** - Penalties up to 50%  
✅ **Can't be gamed** - Smart pattern detection

**Result:** Honest resumes score well, stuffed resumes get penalized!
