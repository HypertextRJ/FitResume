# Score Confidence Indicator

## Purpose

Provide users with **transparency about score certainty**.

Not all scores are equally reliable. Some analyses have:
- Perfect data parsing
- High AI confidence
- Exact skill matches

Others have:
- Parsing challenges
- AI fallback usage
- Many partial matches

**Users deserve to know the difference!**

---

## Confidence Band System

### Three Tiers

| Confidence | Band | Meaning |
|-----------|------|---------|
| **85-100%** | **±3** | HIGH - Very reliable score |
| **65-84%** | **±5** | MEDIUM - Reasonably reliable |
| **0-64%** | **±8** | LOW - Rough estimate |

---

## Calculation Logic

### Five Weighted Factors

```
Total Confidence = Weighted Average of:
1. JD Parsing Quality      (30% weight)
2. Resume Parsing Quality  (20% weight)
3. Skill Matching Quality  (25% weight)
4. Data Completeness       (15% weight)
5. AI Reliability          (10% weight)
```

### Factor 1: JD Parsing Quality (30%)

| Scenario | Confidence | Reasoning |
|----------|-----------|-----------|
| AI only, high confidence | 95% | Best case |
| AI only, medium confidence | 80% | Good |
| AI + Fallback merged | 75% | Reasonable |
| Fallback only | 65% | Lower certainty |

### Factor 2: Resume Parsing (20%)

| Parse Quality | Confidence | Description |
|--------------|-----------|-------------|
| 5/5 | 100% | Perfect formatting |
| 4/5 | 85% | Minor issues |
| 3/5 | 70% | Fair quality |
| 2/5 | 55% | Poor formatting |
| 1/5 | 40% | Very difficult to parse |

### Factor 3: Skill Matching (25%)

| Exact Match Rate | Confidence | Notes |
|-----------------|-----------|-------|
| 80%+ exact matches | 95% | High certainty |
| 60-79% exact | 85% | Good |
| 40-59% exact | 75% | Fair |
| Mostly partial | 65% | Lower certainty |
| Mostly missing | 50% | Rough estimate |

### Factor 4: Data Completeness (15%)

**Deductions:**
- Missing required skills: -20%
- Missing keywords: -10%
- Missing experience: -10%
- Missing resume data: -20%

### Factor 5: AI Reliability (10%)

Based on AI validator tier:
- EXCELLENT: 100%
- GOOD: 85%
- ACCEPTABLE: 70%
- POOR: 55%
- UNRELIABLE: 40%

---

## Examples

### Example 1: High Confidence (±3)

**Scenario:**
- AI parsed JD successfully (high confidence)
- Resume perfectly formatted (5/5)
- 90% exact skill matches
- All data extracted
- AI EXCELLENT tier

**Calculation:**
```
JD Parsing: 95% × 0.30 = 28.5
Resume:     100% × 0.20 = 20.0
Skill Match: 95% × 0.25 = 23.75
Completeness: 100% × 0.15 = 15.0
AI Reliability: 100% × 0.10 = 10.0
─────────────────────────────
Total: 97.25% → 97%
```

**Band:** ±3 (HIGH)

**Display:**
```
Score: 78 ±3 points
Confidence: High (97%)
Range: 75-81 points

Message: "This score is highly reliable. The analysis had 
excellent data quality and strong AI parsing."
```

---

### Example 2: Medium Confidence (±5)

**Scenario:**
- AI + Fallback merged for JD
- Resume good formatting (4/5)
- 60% exact, 30% partial skill matches
- Some missing data
- AI GOOD tier

**Calculation:**
```
JD Parsing: 75% × 0.30 = 22.5
Resume:     85% × 0.20 = 17.0
Skill Match: 85% × 0.25 = 21.25
Completeness: 80% × 0.15 = 12.0
AI Reliability: 85% × 0.10 = 8.5
─────────────────────────────
Total: 81.25% → 81%
```

**Band:** ±5 (MEDIUM)

**Display:**
```
Score: 65 ±5 points
Confidence: Medium (81%)
Range: 60-70 points

Message: "This score is reasonably reliable. Some data was 
extracted using fallback methods, which may introduce minor 
variations."
```

---

### Example 3: Low Confidence (±8)

**Scenario:**
- Fallback JD parsing only
- Resume poor formatting (2/5)
- Mostly partial/missing skill matches
- Missing significant data
- AI POOR/UNRELIABLE tier

**Calculation:**
```
JD Parsing: 65% × 0.30 = 19.5
Resume:     55% × 0.20 = 11.0
Skill Match: 50% × 0.25 = 12.5
Completeness: 60% × 0.15 = 9.0
AI Reliability: 55% × 0.10 = 5.5
─────────────────────────────
Total: 57.5% → 58%
```

**Band:** ±8 (LOW)

**Display:**
```
Score: 52 ±8 points
Confidence: Low (58%)
Range: 44-60 points

Message: "This score has lower confidence due to parsing 
challenges or incomplete data. Consider this as a rough 
estimate."
```

---

## User-Facing Presentation

### JSON API Response

```json
{
  "score": 75,
  "scoreLabel": "Good Match",
  "confidence": {
    "score": 85,
    "band": 3,
    "tier": "HIGH",
    "display": "75 ±3",
    "range": {
      "min": 72,
      "max": 78
    },
    "message": "This score is highly reliable. The analysis had excellent data quality and strong AI parsing.",
    "factors": [
      {
        "factor": "Job Description Parsing",
        "confidence": 95,
        "impact": "High",
        "notes": "AI parsing successful"
      },
      {
        "factor": "Resume Parsing",
        "confidence": 100,
        "impact": "Medium",
        "notes": "Perfect - Clean formatting"
      },
      {
        "factor": "Skill Matching",
        "confidence": 95,
        "impact": "High",
        "notes": "Mostly exact matches"
      },
      {
        "factor": "Data Completeness",
        "confidence": 100,
        "impact": "Medium",
        "notes": "Complete data extraction"
      },
      {
        "factor": "AI Reliability",
        "confidence": 100,
        "impact": "Low",
        "notes": "AI EXCELLENT"
      }
    ]
  },
  "breakdown": {...}
}
```

### Frontend Display

**Main Card:**
```
┌────────────────────────────────────┐
│  Your ATS Score                    │
│  ┌──────┐                          │
│  │ 75   │  ±3                      │
│  └──────┘                          │
│  High Confidence (85%)             │
│  Likely range: 72-78 points        │
└────────────────────────────────────┘
```

**Confidence Details (Expandable):**
```
Confidence Breakdown

✅ Job Description Parsing: 95% (High impact)
   AI parsing successful

✅ Resume Parsing: 100% (Medium impact)
   Perfect - Clean formatting

✅ Skill Matching: 95% (High impact)
   Mostly exact matches

✅ Data Completeness: 100% (Medium impact)
   Complete data extraction

✅ AI Reliability: 100% (Low impact)
   AI EXCELLENT
```

---

## Benefits

### For Users

1. **Transparency** - Know how certain the score is
2. **Context** - Understand why confidence is high/low
3. **Actionability** - If low confidence due to resume format, can reformat and resubmit

### For System

1. **Honesty** - Admit uncertainty when it exists
2. **Trust** - Users trust transparent systems more
3. **Debugging** - Helps identify parsing/AI issues

---

## When to Show Low Confidence

**Scenarios that trigger LOW confidence:**

1. Resume uploaded as scanned image PDF (poor parsing)
2. AI timeout → used fallback only
3. JD very short or vague (< 100 chars)
4. Resume has unusual format
5. Many skills found via partial matching only

**What to tell user:**
- "Your resume format made it difficult to extract data accurately"
- "Try uploading a text-based PDF for better accuracy"
- "The job description was brief, limiting analysis depth"

---

## Avoiding User Confusion

### ❌ Don't Say

- "AI confidence: 0.7834" (too technical)
- "Schema validation failed" (jargon)
- "Fallback parser engaged" (confusing)

### ✅ Do Say

- "High confidence" / "Medium confidence" / "Lower confidence"
- "Score likely within ±3 points"
- "Some data extracted using backup methods"
- "Clean resume format = higher confidence"

---

## Summary

✅ **Transparent** - Users know score certainty  
✅ **Simple** - Three tiers (±3, ±5, ±8)  
✅ **Explainable** - Show 5 factors & impacts  
✅ **Actionable** - Users can improve confidence by reformatting  
✅ **Honest** - Admits when uncertain

**Result:** Users trust the system more because it's transparent about limitations!
