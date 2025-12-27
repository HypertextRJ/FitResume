# Test Data Guidelines

This folder contains sample resumes and job descriptions for testing the ATS Compatibility System.

## Important Notes

Since we cannot create actual PDF files here, you'll need to:

1. **Create test resumes yourself** in PDF or DOCX format with varying quality levels:

### High-Quality Resume (Target: 85-90%)
Should include:
- All or nearly all required skills from the JD
- Exactly matches experience requirement (5 years)
- Correct education level
- Several preferred skills
- Good keyword density
- Clean, ATS-friendly format

### Medium-Quality Resume (Target: 60-70%)
Should include:
- 70-80% of required skills (1-2 missing)
- Slightly short on experience (3-4 years)
- Meets education requirement
- 1-2 preferred skills
- Moderate keyword density

### Low-Quality Resume (Target: 30-45%)
Should include:
- Only 40-50% of required skills (many missing)
- Significantly short on experience (0-2 years)
- Lower education level or missing
- No preferred skills
- Poor keyword alignment
- Possible format issues

## Testing Workflow

1. Use the sample JD in `sample-jd.txt`
2. Upload your test resumes (PDF/DOCX)
3. Verify scores match expected ranges
4. Review explanations for specificity and accuracy
5. Ensure 90+ scores are very rare

## Validation Criteria

✅ **Good Scoring System:**
- High-quality resumes score 85-90% (not 95%+)
- Medium resumes score 60-70%
- Poor resumes score 30-45%
- Every point deduction has clear reasoning
- Explanations reference specific skills/requirements

❌ **Bad Scoring System:**
- Most resumes score 90%+
- Vague explanations
- No specific skill/requirement references
- Score doesn't match visible gaps
