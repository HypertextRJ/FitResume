# Semantic Similarity Normalization System

## Problem Statement

**Raw cosine similarity (0.0-1.0) can exaggerate relevance and inflate scores.**

A 0.70 cosine similarity might seem "good" but may not reflect actual job relevance in context.

---

## Solution: Strict Tiered Mapping

Map cosine similarity → points using **predefined tiers** with **linear interpolation**.

---

## Normalization Table

| Cosine Similarity | Tier | Max Points | Interpretation |
|-------------------|------|------------|----------------|
| **< 0.35** | NONE | **0** | Not relevant - No credit |
| **0.35 - 0.50** | LOW | **8** | Low relevance - Minimal credit |
| **0.50 - 0.65** | MEDIUM | **15** | Medium relevance - Moderate credit |
| **0.65 - 0.80** | HIGH | **22** | High relevance - Strong credit |
| **> 0.80** | EXCEPTIONAL | **25** | Exceptional match - Full credit |

---

## Mapping Formula

For each tier (except NONE):

```
tierRange = tier_max - tier_min
positionInTier = similarity - tier_min
tierProgress = positionInTier / tierRange

points = tierProgress × tier_maxPoints
points = floor(points × 100) / 100  // 2 decimal places, NO rounding up
```

### Example Calculation

**Similarity = 0.72**

1. Tier: HIGH (0.65 - 0.80)
2. tierRange = 0.80 - 0.65 = 0.15
3. positionInTier = 0.72 - 0.65 = 0.07
4. tierProgress = 0.07 / 0.15 = 0.4667
5. points = 0.4667 × 22 = **10.27 points**

---

## Conversion Examples

| Similarity | Tier | Calculation | Points | Notes |
|------------|------|-------------|--------|-------|
| **0.95** | EXCEPTIONAL | (0.95-0.80)/(1.00-0.80) × 25 | **18.75** | Near-perfect match |
| **0.85** | EXCEPTIONAL | (0.85-0.80)/(1.00-0.80) × 25 | **6.25** | Just entered exceptional tier |
| **0.75** | HIGH | (0.75-0.65)/(0.80-0.65) × 22 | **14.67** | Mid-high range |
| **0.70** | HIGH | (0.70-0.65)/(0.80-0.65) × 22 | **7.33** | Just in high tier |
| **0.60** | MEDIUM | (0.60-0.50)/(0.65-0.50) × 15 | **10.00** | Mid-med range |
| **0.55** | MEDIUM | (0.55-0.50)/(0.65-0.50) × 15 | **5.00** | Just in medium tier |
| **0.45** | LOW | (0.45-0.35)/(0.50-0.35) × 8 | **5.33** | Mid-low range |
| **0.40** | LOW | (0.40-0.35)/(0.50-0.35) × 8 | **2.67** | Just in low tier |
| **0.30** | NONE | N/A | **0.00** | Below threshold |
| **0.20** | NONE | N/A | **0.00** | Well below threshold |
| **0.10** | NONE | N/A | **0.00** | Irrelevant |

---

## Key Observations

### Harsh Thresholds
- **34% similarity → 0 points** (harsh cutoff!)
- **35% similarity → starts earning points** (but only ~0.5 pts)

### Exceptional is Rare
- Need **80%+ similarity** for EXCEPTIONAL tier
- Even at 80%, only get 0 points (bottom of tier)
- Need **95%+** to approach max 25 points

### No Inflation
- 70% similarity ≠ 70% of 25 points (17.5)
- 70% similarity = **7.33 points** (only 29% of max!)

---

## Tier Boundaries Impact

### Edge Cases

#### Just Below vs Just Above 0.80
```
Similarity 0.79 → HIGH tier → 20.53 pts
Similarity 0.80 → EXCEPTIONAL tier → 0.00 pts ← Drops!
```

**Why?** New tier resets calculation. Must climb from tier bottom.

#### Just Below vs Just Above 0.35
```
Similarity 0.34 → NONE tier → 0.00 pts
Similarity 0.35 → LOW tier → 0.00 pts ← Starts earning
Similarity 0.36 → LOW tier → 0.53 pts
```

---

## Usage in ATS System

### Keyword Density Scoring (10 points max)

Instead of direct percentage:
```javascript
// OLD (inflated)
if (density >= 0.70) points = 10;  // 70% = full points

// NEW (strict)
const normalized = normalizeSimilarity(density, 10);
points = normalized.points;  // 70% = 2.93 points!
```

### Semantic Matching (if added later)

For embedding-based skill matching:
```javascript
const embedding_similarity = 0.68;  // cosine similarity
const normalized = normalizeSimilarity(embedding_similarity, 6);
// tier: HIGH, points: 4.40 (not 4.08 if direct scale)
```

---

## Constraints Enforced

✅ **No Rounding Up** - `Math.floor()` used  
✅ **No Bonus Points** - Strict tier maxes  
✅ **Linear Within Tier** - Fair interpolation  
✅ **Clear Thresholds** - No ambiguity

---

## Visual Mapping Chart

```
Similarity   Tier          Points (out of 25)
0.00 ████████████████████████ NONE           0.00
0.10 ████████████████████████ NONE           0.00
0.20 ████████████████████████ NONE           0.00
0.30 ████████████████████████ NONE           0.00
0.35 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ LOW            0.00
0.40 ▓▓▓░░░░░░░░░░░░░░░░░░░░░ LOW            2.67
0.45 ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░ LOW            5.33
0.50 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ MEDIUM         0.00
0.55 ▒▒▒▒░░░░░░░░░░░░░░░░░░░░ MEDIUM         5.00
0.60 ▒▒▒▒▒▒▓░░░░░░░░░░░░░░░░░ MEDIUM        10.00
0.65 ░░░░░░░░░░░░░░░░░░░░░░░░ HIGH           0.00
0.70 ░░░░▓░░░░░░░░░░░░░░░░░░░ HIGH           7.33
0.75 ░░░░░░░░▓░░░░░░░░░░░░░░░ HIGH          14.67
0.80 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ EXCEPTIONAL    0.00
0.85 ▓▓▓░░░░░░░░░░░░░░░░░░░░░ EXCEPTIONAL    6.25
0.90 ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░ EXCEPTIONAL   12.50
0.95 ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ EXCEPTIONAL   18.75
1.00 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ EXCEPTIONAL   25.00
```

---

## Code Integration

### Import
```javascript
const { normalizeSimilarity } = require('../utils/similarityNormalizer');
```

### Usage
```javascript
const cosineSim = calculateCosineSimilarity(text1, text2);
const result = normalizeSimilarity(cosineSim, 25);

console.log(result);
// {
//   points: 10.27,
//   similarity: 0.72,
//   tier: 'HIGH',
//   tierMaxPoints: 22,
//   explanation: '72% similarity - High relevance - 10.3/25 points'
// }
```

### Batch Processing
```javascript
const { normalizeBatch } = require('../utils/similarityNormalizer');

const similarities = [0.85, 0.60, 0.40];
const results = normalizeBatch(similarities, 10);
// [{points: 2.5, ...}, {points: 4.0, ...}, {points: 1.07, ...}]
```

---

## Testing

Run built-in examples:
```javascript
const { getExamples } = require('../utils/similarityNormalizer');
console.table(getExamples());
```

Output:
```
┌─────────┬────────────┬──────┬────────────────┬────────┐
│ (index) │ similarity │ tier │ tierMaxPoints  │ points │
├─────────┼────────────┼──────┼────────────────┼────────┤
│    0    │    0.95    │ EXCEPTIONAL │   25   │ 18.75  │
│    1    │    0.85    │ EXCEPTIONAL │   25   │  6.25  │
│    2    │    0.75    │  HIGH     │   22   │ 14.67  │
│    3    │    0.70    │  HIGH     │   22   │  7.33  │
│    4    │    0.60    │ MEDIUM    │   15   │ 10.00  │
│    5    │    0.55    │ MEDIUM    │   15   │  5.00  │
│    6    │    0.45    │  LOW      │    8   │  5.33  │
│    7    │    0.40    │  LOW      │    8   │  2.67  │
│    8    │    0.30    │  NONE     │    0   │  0.00  │
│    9    │    0.20    │  NONE     │    0   │  0.00  │
│   10    │    0.10    │  NONE     │    0   │  0.00  │
└─────────┴────────────┴──────┴────────────────┴────────┘
```

---

## Summary

✅ **Strict tiers prevent inflation**  
✅ **Linear interpolation within tiers**  
✅ **< 35% gets zero points (harsh!)**  
✅ **80%+ needed for exceptional**  
✅ **No rounding up, no bonuses**  
✅ **Clear, explainable mapping**

**Result:** Realistic scoring that maintains 90+ overall scores as rare!
