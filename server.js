require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve index.html for root route (Vercel fix)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Import cleanup service
const cleanupService = require('./services/fileCleanupService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx', '.doc'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ATS Compatibility System API is running',
        timestamp: new Date().toISOString(),
        aiProvider: process.env.AI_PROVIDER || 'gemini'
    });
});

// Main analysis endpoint
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    let filePath = null;

    try {
        const { jobDescription } = req.body;
        const resumeFile = req.file;
        filePath = resumeFile?.path;

        // Validation
        if (!resumeFile) {
            return res.status(400).json({ error: 'Resume file is required' });
        }
        if (!jobDescription || jobDescription.trim().length < 50) {
            // Cleanup file before returning error
            await cleanupService.immediateCleanup(filePath);
            return res.status(400).json({ error: 'Job description must be at least 50 characters' });
        }

        console.log(`📄 Analyzing resume: ${resumeFile.originalname}`);
        console.log(`📋 Job description length: ${jobDescription.length} chars`);

        // Import services (lazy loading to avoid startup errors)
        const resumeParser = require('./services/resumeParser');
        const jdParser = require('./services/jdParser');
        const matcher = require('./engine/matcher');
        const explainer = require('./engine/explainer');

        // Step 1: Parse resume
        console.log('🔍 Step 1: Parsing resume...');
        const resumeData = await resumeParser.parseResume(resumeFile.path);

        // Step 2: Parse job description
        console.log('🔍 Step 2: Parsing job description...');
        const jdData = await jdParser.parseJobDescription(jobDescription);

        // Step 3: Calculate match score
        console.log('🎯 Step 3: Calculating compatibility score...');
        const matchResult = await matcher.calculateMatch(resumeData, jdData);

        // Step 4: Generate explanations
        console.log('💡 Step 4: Generating explanations...');
        const explanation = explainer.generateExplanation(matchResult, resumeData, jdData);

        // Step 4.5: Advanced Insights & Confidence
        console.log('🚀 Step 4.5: Generating advanced insights...');
        const advancedInsights = require('./services/advancedInsights');
        const scoreConfidenceCalculator = require('./utils/scoreConfidenceCalculator');

        const insights = advancedInsights.generateInsights(matchResult, resumeData, jdData);
        const confidence = scoreConfidenceCalculator.calculateConfidence(matchResult, jdData, resumeData);

        // Step 5: IMMEDIATE cleanup (privacy-first!)
        console.log('🗑️  Step 5: Deleting uploaded resume...');
        await cleanupService.immediateCleanup(filePath);
        filePath = null; // Mark as cleaned

        // Return complete analysis
        const response = {
            score: matchResult.totalScore,
            scoreLabel: matchResult.scoreLabel,
            confidence: confidence,
            breakdown: matchResult.breakdown,
            explanation: explanation,
            advancedInsights: insights,
            timestamp: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            privacy: {
                resumeDeleted: true,
                storageDuration: '0 seconds (immediate deletion)',
                dataRetention: 'None - no resume content stored'
            }
        };

        console.log(`✅ Analysis complete. Score: ${matchResult.totalScore}/100 (${matchResult.scoreLabel})`);
        res.json(response);

    } catch (error) {
        console.error('❌ Error during analysis:', error);

        // FAIL-SAFE cleanup
        if (filePath) {
            await cleanupService.immediateCleanup(filePath);
        }

        res.status(500).json({
            error: 'Analysis failed',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    // Cleanup file on error
    if (req.file?.path) {
        cleanupService.immediateCleanup(req.file.path).catch(() => { });
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
        }
        return res.status(400).json({ error: err.message });
    }

    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel
module.exports = app;

// Start server only if run directly (Local Development)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('\n');
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║  🎯 FitResume - ATS Compatibility                     ║');
        console.log('║  📊 Strict • Explainable • Job-Specific               ║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log(`║  🚀 Server running on http://localhost:${PORT}        ║`);
        console.log(`║  🤖 AI Provider: ${process.env.AI_PROVIDER || 'GEMINI'}                            ║`);
        console.log('║  📝 Status: READY                                     ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('\n');

        // Verify AI configuration
        const aiProvider = process.env.AI_PROVIDER || 'gemini';
        console.log(`✅ ${aiProvider === 'openai' ? 'OpenAI' : 'Gemini AI'} initialized (${aiProvider === 'openai' ? process.env.OPENAI_MODEL : process.env.GEMINI_MODEL})`);

        if (aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
            console.warn('⚠️  WARNING: OpenAI API key is missing!');
        } else if (aiProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
            console.warn('⚠️  WARNING: Gemini API key is missing!');
        }

        console.log('\n🔒 Privacy & Data Protection:');
        cleanupService.startScheduledCleanup();
    });
}
