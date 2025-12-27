# 🎯 ATS Compatibility System

> **Strict • Explainable • Job-Specific**

An AI-powered resume compatibility checker that provides **realistic, harsh scoring** with detailed, traceable explanations. This is NOT an official ATS—it's a tool to help candidates understand how their resume matches specific job requirements.

## ⚡ Philosophy

- **No Score Inflation**: 90+ scores are reserved for exceptional matches only
- **Transparent Scoring**: Every point has a specific, explainable reason
- **Job-Specific**: All analysis tied directly to the job description
- **Realistic**: Most resumes score 50-70%, not 95%

## 📊 Scoring Algorithm

**Total: 100 Points**

| Category | Points | Penalties |
|----------|--------|-----------|
| **Required Skills** | 30 | -6 pts per missing skill |
| **Experience** | 25 | -10 to -25 pts based on gap |
| **Education** | 15 | -10 to -15 pts if insufficient |
| **Preferred Skills** | 15 | +3 pts per skill (max 5) |
| **Keywords** | 10 | Based on density (0-70%+) |
| **Format & Clarity** | 5 | Based on parse quality |

### Score Ranges

- **90-100%**: Exceptional Match (RARE)
- **76-89%**: Very Good Match
- **61-75%**: Good Match  
- **41-60%**: Fair Match
- **0-40%**: Poor Match

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Gemini API key OR OpenAI API key

### Installation

```bash
# 1. Clone/navigate to project directory
cd ATSProject

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Edit .env and add your API key
# For Gemini:
GEMINI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=gemini

# For OpenAI:
OPENAI_API_KEY=your_openai_api_key_here
AI_PROVIDER=openai
```

### Running the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 API Documentation

### `POST /api/analyze`

Analyze resume compatibility with job description.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `resume` (file): PDF or DOCX file (max 5MB)
  - `jobDescription` (text): Complete job description (min 50 chars)

**Response:**
```json
{
  "score": 72,
  "scoreLabel": "Good Match",
  "breakdown": {
    "requiredSkills": { 
      "points": 24, 
      "maxPoints": 30,
      "matchedSkills": ["Python", "JavaScript"],
      "missingSkills": ["Go"]
    },
    "experience": {
      "points": 20,
      "maxPoints": 25,
      "verdict": "0-2 years short"
    },
    ...
  },
  "explanation": {
    "summary": "Good match (72/100). This resume demonstrates...",
    "strengths": [...],
    "gaps": [...],
    "recommendations": [...],
    "scoreJustification": {...}
  }
}
```

### `GET /api/health`

Health check endpoint.

## 🎨 Features

### Backend
- ✅ PDF & DOCX parsing
- ✅ AI-powered job description analysis
- ✅ Strict, transparent scoring algorithm
- ✅ Detailed explanation generation
- ✅ Gemini + OpenAI support with fallback

### Frontend
- ✅ Premium dark mode design
- ✅ Glassmorphism effects
- ✅ Drag-and-drop file upload
- ✅ Animated score visualization
- ✅ Comprehensive results breakdown
- ✅ Mobile responsive

## 📝 How It Works

1. **Resume Parsing**: Extracts text, skills, experience, education from PDF/DOCX
2. **JD Analysis**: AI extracts required/preferred skills, experience, education requirements
3. **Strict Matching**: Compares resume against JD with harsh penalties for gaps
4. **Explanation**: Generates detailed, evidence-based reasoning for every score
5. **Visualization**: Displays results with animated charts and actionable recommendations

## 🧪 Testing

Create a `.env` file with your API keys, then:

```bash
npm start
```

Use the sample test data in `/test-data` folder (coming soon) or use your own resumes and job descriptions.

### Testing Philosophy

- High-quality resume with perfect match → 85-90% (NOT 95%+)
- Good resume with some gaps → 60-70%
- Poor match → 30-45%

## ⚙️ Configuration

Edit `config/scoring.config.js` to adjust:
- Penalty weights
- Score thresholds
- Category weights

## 🤝 Contributing

This is a strict scoring system. When contributing:
- NO score inflation
- All scoring must be traceable
- Maintain harsh but fair philosophy

## ⚠️ Disclaimer

**This is NOT an official Applicant Tracking System (ATS).**

This tool provides compatibility analysis to help candidates understand how their resume matches a job description. It does not:
- Guarantee passage through real ATS systems
- Ensure interview selection
- Replace human recruiter judgment

Scores reflect match quality based on strict criteria, not hiring likelihood.

## 📄 License

MIT License - See LICENSE file for details

## 🐛 Troubleshooting

### "No AI providers available"
- Ensure you've added `GEMINI_API_KEY` or `OPENAI_API_KEY` to `.env`
- Restart the server after adding keys

### "Failed to parse PDF"
- Ensure PDF is text-based, not scanned images
- Try converting to DOCX

### Low scores on good resumes
- **This is expected!** The system is intentionally harsh
- Review the "Gaps" section for specific missing requiremen
ts
- 60-70% is actually a good score in this system

## 📧 Support

For issues or questions, check the detailed error messages in browser console and server logs.

---

**Remember**: 90+ scores should be RARE. If you're seeing them frequently, the scoring is too lenient.
