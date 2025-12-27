# Context-Aware Keyword Density - Test Cases

## Test Case 1: Honest Developer Resume ✅

### Resume Content
```
PROFESSIONAL EXPERIENCE
Senior Full-Stack Developer | TechCorp | 2020-Present
• Developed Python microservices using FastAPI and PostgreSQL
• Built React dashboards with real-time data visualization
• Implemented Docker containerization for deployment pipeline
• Optimized AWS infrastructure reducing costs by 30%

Software Engineer | StartupXYZ | 2018-2020
• Created Node.js REST APIs serving 1M+ requests/day
• Designed MongoDB database schema for user management

SKILLS
Git, Agile, Scrum, CI/CD, Kubernetes
```

### JD Keywords
`Python`, `React`, `Docker`, `AWS`, `Node.js`, `MongoDB`

### Expected Score
```
Python: In experience + "Developed" → Full credit (1.0)
React: In experience + "Built" → Full credit (1.0)
Docker: In experience + "Implemented" → Full credit (1.0)
AWS: In experience + "Optimized" → Full credit (1.0)
Node.js: In experience + "Created" → Full credit (1.0)
MongoDB: In experience + "Designed" → Full credit (1.0)

Total Credit: 6.0 / 6 keywords = 100%
Stuffing Penalty: 0%
Adjusted Density: 100%
Points: 10/10 ✅
Verdict: "Excellent keyword alignment"
```

---

## Test Case 2: Skills-Only Resume ⚡

### Resume Content
```
OBJECTIVE
Looking for a software engineering role.

EDUCATION
BS in Computer Science, 2022

SKILLS
Python, React, Docker, AWS, Node.js, MongoDB, PostgreSQL,
JavaScript, TypeScript, Kubernetes, Git, Linux
```

### JD Keywords
`Python`, `React`, `Docker`, `AWS`, `Node.js`, `MongoDB`

### Expected Score
```
All 6 keywords: Only in skills section → 0.5 credit each

Total Credit: 3.0 / 6 = 50%
Stuffing Penalty: 0%
Adjusted Density: 50%
Points: 7/10 ⚡
Verdict: "Good keyword presence"
```

**Why reduced?** No contextual usage, only skills list.

---

## Test Case 3: Moderate Stuffing ⚠️

### Resume Content
```
EXPERIENCE
Python Developer with Python experience. Built Python applications
using Python frameworks. Python expert in Python development.

Worked on React projects using React and React Native.

SKILLS
Python, Python, React, Docker, AWS
```

### JD Keywords
`Python`, `React`, `Docker`, `AWS`

### Expected Score
```
Python: 6 occurrences
  - 3 contextual uses (capped) → 1.0 credit
  - But 6 total → -10% stuffing penalty
  
React: 3 occurrences (in experience) → 1.0 credit

Docker: 1 in skills only → 0.5 credit

AWS: 1 in skills only → 0.5 credit

Total Credit: 3.0 / 4 = 75%
Stuffing Penalty: -10%
Adjusted Density: 65%
Points: 10/10 initially, but -10% → 9/10 ⚠️
Verdict: "Excellent keyword alignment (10% stuffing penalty applied)"
```

---

## Test Case 4: Severe Stuffing ❌

### Resume Content
```
SKILLS
Python, JavaScript, React, Node.js, Docker, AWS, Kubernetes,
Python, JavaScript, React, Node.js, Docker, AWS, Kubernetes,
Python, JavaScript, React, Node.js, Docker, AWS, Kubernetes,
Python, JavaScript, React, Node.js, Docker, AWS, Kubernetes

SUMMARY
Python developer. JavaScript expert. React specialist.
```

### JD Keywords
`Python`, `React`, `Docker`, `AWS`

### Expected Score
```
All keywords: 4 repetitions each

Python: All 4 in skills → 0.5 credit, but -10% (6+ reps)
React: All 4 in skills → 0.5 credit, but -10% penalty
Docker: All 4 in skills → 0.5 credit, but -5% (skills spam)
AWS: All 4 in skills → 0.5 credit, but -5% penalty

Plus: Comma-stuffing detected → -15%

Total Credit: 2.0 / 4 = 50%
Stuffing Penalties:
  - 6+ reps: -20% (4 keywords)
  - Skills-only spam: -10%
  - Comma stuffing: -15%
  - Total: -45%

Adjusted Density: 50% - 45% = 5%
Points: 0/10 ❌
Verdict: "Very poor keyword match (45% stuffing penalty applied)"
```

**Result:** Completely penalized! System cannot be gamed.

---

## Test Case 5: Mixed Context

### Resume Content
```
EXPERIENCE
Software Engineer | Company | 2020-2023
• Developed RESTful APIs
• Worked extensively with databases
• Managed cloud infrastructure

PROJECTS
Built a web dashboard using modern frameworks

SKILLS
Python, React, Docker, AWS, Node.js, PostgreSQL
```

### JD Keywords
`Python`, `React`, `Docker`, `AWS`, `Node.js`

### Expected Score
```
Python: Only in skills → 0.5 credit
React: Only in skills → 0.5 credit
Docker: Only in skills → 0.5 credit
AWS: Only in skills → 0.5 credit
Node.js: Only in skills → 0.5 credit

Total Credit: 2.5 / 5 = 50%
Stuffing Penalty: 0%
Adjusted Density: 50%
Points: 7/10 ⚡
Verdict: "Good keyword presence"
```

**Note:** Even though experience section exists, keywords aren't
used WITH action verbs, so no contextual credit.

---

## Summary Table

| Test Case | Contextual | Skills-Only | Stuffing | Density | Points |
|-----------|-----------|-------------|----------|---------|--------|
| **Honest Developer** | 6/6 | 0/6 | 0% | 100% | **10/10** ✅ |
| **Skills-Only** | 0/6 | 6/6 | 0% | 50% | **7/10** ⚡ |
| **Moderate Stuffing** | 2/4 | 2/4 | -10% | 65% | **9/10** ⚠️ |
| **Severe Stuffing** | 0/4 | 4/4 | -45% | 5% | **0/10** ❌ |
| **Mixed Context** | 0/5 | 5/5 | 0% | 50% | **7/10** ⚡ |

---

## Key Takeaways

✅ **Contextual usage rewarded** - Full credit for keywords with action verbs  
⚡ **Skills-only reduces score** - Only 50% credit  
⚠️ **Moderate stuffing caught** - Penalties applied  
❌ **Severe stuffing punished** - Complete score loss  

**You cannot game this system!**
