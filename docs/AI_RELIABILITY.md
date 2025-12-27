# AI Reliability & Failure Handling

## Philosophy: Never Trust AI Blindly

**AI is powerful but not infallible.**

Problems we handle:
- ❌ Timeouts (API slow/unavailable)
- ❌ Hallucinations (made-up skills)
- ❌ Incomplete responses (missing fields)
- ❌ Overconfident scoring (inflated matches)

**Core Rule:** System MUST ALWAYS return a score, even if AI fails 100%

---

## Reliability Architecture

```
┌─────────────────────────────────────────┐
│  1. AI Call with Timeout (30s)          │
└──────────────┬──────────────────────────┘
               │
               ├─ Success → Validate Response
               │            ↓
               │     ┌──────────────────┐
               │     │ 2. Schema Check  │
               │     │ 3. Confidence    │
               │     │ 4. Hallucination │
               │     └────────┬─────────┘
               │              │
               │      ┌───────┴────────┐
               │      │ High Conf?     │
               │      ├── Yes → Use AI │
               │      └── No  → Fallback│
               │
               └─ Timeout/Error → Retry
                                   ↓
                            ┌──────────────┐
                            │ Max Retries? │
                            ├─ No → Retry  │
                            └─ Yes→Fallback│
```

---

## Confidence Scoring System

### Validation Checks

**For JD Parsing:**

| Check | Impact | Deduction |
|-------|--------|-----------|
| Missing required field | Critical | -20% |
| requiredSkills not array | Critical | -30% |
| requiredSkills empty | High | -20% |
| Experience not number | High | -20% |
| Experience unrealistic | Medium | -30% |
| Hallucinated skills (30%+) | Medium | -10% per skill |
| Very few items extracted | Medium | -20% |

**Confidence Tiers:**

| Confidence | Tier | Action |
|------------|------|--------|
| 90-100% | EXCELLENT | Use AI directly |
| 70-89% | GOOD | Use AI with caution |
| 50-69% | ACCEPTABLE | Use AI or fallback |
| 30-49% | POOR | Prefer fallback |
| 0-29% | UNRELIABLE | **Must use fallback** |

---

## Hallucination Detection

### How It Works

```javascript
// AI claims "React" is a required skill
const aiSkills = ["React", "Python", "Blockchain"];

// Check if each skill appears in original JD
const jdText = "Looking for Python developer...";

// Hallucination check:
"React" not in JD → Hallucinated! ❌
"Python" in JD → Valid ✓
"Blockchain" not in JD → Hallucinated! ❌

// If >30% hallucinated → Low confidence
```

### Example Detection

**JD Text:**
```
We need a Python developer with Django experience.
```

**AI Response:**
```json
{
  "requiredSkills": ["Python", "Django", "React", "kubernetes", "AWS"]
}
```

**Analysis:**
- Python ✓ (in JD)
- Django ✓ (in JD)
- React ❌ (not in JD - hallucinated!)
- Kubernetes ❌ (not in JD - hallucinated!)
- AWS ❌ (not in JD - hallucinated!)

**Result:** 60% hallucination rate → Confidence drops to 30% → **Trigger fallback!**

---

## Timeout Handling

### Default Timeouts

- **JD Parsing:** 30 seconds
- **Resume Parsing:** 30 seconds
- **Retry Attempts:** 1 (total 2 attempts)
- **Backoff:** Exponential (1s, 2s, etc.)

### Flow

```
Attempt 1 → 30s timeout
    ↓ Fail
Wait 1 second
    ↓
Attempt 2 → 30s timeout
    ↓ Fail
Use Fallback
```

---

## Failure Scenarios & Handling

### Scenario 1: AI Timeout ⏱️

**Problem:** API takes > 30 seconds

**Handling:**
```javascript
try {
  const result = await withTimeout(aiCall(), 30000);
} catch (timeoutError) {
  // Log failure
  await validator.logFailure('JD Parsing', timeoutError);
  
  // Retry once
  try {
    const result = await withTimeout(aiCall(), 30000);
  } catch {
    // Use fallback
    return fallbackParser.parse(jobDescription);
  }
}
```

**Outcome:** System completes in < 65 seconds worst case

---

### Scenario 2: AI Returns Garbage 🗑️

**Problem:** AI returns invalid JSON or nonsense

**Response:**
```json
{
  "requiredSkills": "Python, React" // Should be array!
}
```

**Handling:**
```javascript
const validation = validator.validateJDResponse(response);
// isValid: false
// confidence: 0.5
// issues: ["requiredSkills is not an array"]

if (validation.shouldUseFallback) {
  return fallbackParser.parse(jobDescription);
}
```

**Outcome:** Fallback used, system continues

---

### Scenario 3: AI Hallucinations 🌈

**Problem:** AI invents skills not in JD

**Response:**
```json
{
  "requiredSkills": ["Python", "Magic", "Unicorn Riding"]
}
```

**Handling:**
```javascript
const hallucinated = detectHallucination(skills, originalJD);
// ["Magic", "Unicorn Riding"]

if (hallucinated.length > skills.length * 0.3) {
  confidence -= 0.1 * hallucinated.length;
  // confidence = 0.8 - 0.2 = 0.6
}

if (confidence < 0.5) {
  return fallbackParser.parse(jobDescription);
}
```

**Outcome:** Low confidence triggers fallback

---

### Scenario 4: Incomplete Response 📋

**Problem:** AI returns partial data

**Response:**
```json
{
  "requiredSkills": ["Python"],
  "preferredSkills": []
  // Missing: requiredExperience, educationRequirement, etc.
}
```

**Handling:**
```javascript
const validation = validator.validateJDResponse(response);
// Missing fields detected
// confidence = 0.4 (low)

if (validation.shouldUseFallback) {
  // Merge AI partial + fallback
  return fallbackParser.mergeWithAI(response, fallbackResults);
}
```

**Outcome:** Best of both worlds - AI + fallback merged

---

### Scenario 5: AI API Down 🔴

**Problem:** API completely unavailable (network error, rate limit, etc.)

**Handling:**
```javascript
try {
  const result = await aiCall();
} catch (networkError) {
  // Log: "AI API unreachable"
  console.log('🔄 AI unavailable, using fallback');
  
  return {
    data: fallbackParser.parse(input),
    confidence: 0.5,
    usedFallback: true
  };
}
```

**Outcome:** System works without AI (deterministic parsing)

---

## Logging & Debugging

### Failure Logs

**Location:** `logs/ai-failures-YYYY-MM-DD.log`

**Format:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "context": "JD Parsing",
  "error": {
    "message": "AI timeout: Operation took longer than 30000ms",
    "code": "AI_TIMEOUT"
  },
  "input": {
    "type": "string",
    "length": 1543,
    "preview": "We are seeking an experienced..."
  }
}
```

### Console Output

**Successful AI Call:**
```
🤖 JD Parsing (attempt 1/2)
   Confidence: 87% (GOOD)
   ✅ Using AI results
```

**Low Confidence:**
```
🤖 JD Parsing (attempt 1/2)
   Confidence: 45% (POOR)
   Issues: requiredSkills is empty (suspicious)
   ⚠️  Low confidence, using fallback
```

**Complete Failure:**
```
🤖 JD Parsing (attempt 1/2)
   ❌ Attempt 1 failed: Request timeout
🤖 JD Parsing (attempt 2/2)
   ❌ Attempt 2 failed: Request timeout
   🔄 All attempts failed, using fallback
```

---

## Integration Example

### Wrapping AI Call

**Old approach:**
```javascript
const aiResponse = await aiService.callAI(prompt);
return parseAIResponse(aiResponse);
```

**New reliable approach:**
```javascript
const result = await validator.reliableAICall(
  () => aiService.callAI(prompt),
  {
    context: 'JD Parsing',
    validator: (response) => validator.validateJDResponse(
      parseAIResponse(response), 
      originalJD
    ),
    fallback: () => fallbackParser.parse(originalJD),
    timeout: 30000,
    retries: 1
  }
);

return result.data; // Always returns valid data!
```

---

## Guarantees

✅ **System never crashes due to AI**  
✅ **Always returns a score**  
✅ **Graceful degradation** (AI → Fallback)  
✅ **Transparency** (logs confidence & issues)  
✅ **Debugging** (failure logs saved)  
✅ **Timeout protection** (30s max per call)  
✅ **Retry logic** (2 attempts)  
✅ **Hallucination detection** (validates against source)

---

## Configuration

### Adjust Timeouts

```javascript
// In aiReliabilityValidator.js
const result = await validator.reliableAICall(
  operation,
  {
    timeout: 45000 // ← Adjust here (ms)
  }
);
```

### Adjust Confidence Threshold

```javascript
// In validateJDResponse
if (confidence < 0.5) { // ← Lower = more lenient
  shouldUseFallback = true;
}
```

---

## Summary

🛡️ **Multi-layer protection:**
1. Timeout protection (30s)
2. Schema validation
3. Hallucination detection
4. Confidence scoring
5. Automatic fallback
6. Failure logging

🎯 **Result:**
- System always works
- AI failures don't crash scoring
- Clear debugging info
- Graceful degradation

**Your ATS system is now AI-resilient and production-ready!**
