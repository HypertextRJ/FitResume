/**
 * ATS Compatibility Checker - Frontend Application
 * Handlesfile uploads, API calls, and results visualization
 */

// State
let uploadedFile = null;

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const uploadSuccess = document.getElementById('uploadSuccess');
const uploadFilename = document.getElementById('uploadFilename');
const resumeFileInput = document.getElementById('resumeFile');
const changeFileButton = document.getElementById('changeFile');
const jobDescriptionInput = document.getElementById('jobDescription');
const charCount = document.getElementById('charCount');
const analyzeButton = document.getElementById('analyzeButton');

const inputView = document.getElementById('inputView');
const loadingView = document.getElementById('loadingView');
const resultsView = document.getElementById('resultsView');
const resultsContent = document.getElementById('resultsContent');
const loadingSteps = document.getElementById('loadingSteps');
const backButton = document.getElementById('backButton');
const heroSection = document.getElementById('heroSection');
const featuresSection = document.getElementById('featuresSection');

// ============================================
// File Upload Handlers
// ============================================

uploadZone.addEventListener('click', () => {
  resumeFileInput.click();
});

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
});

resumeFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

changeFileButton.addEventListener('click', (e) => {
  e.stopPropagation();
  resumeFileInput.click();
});

function handleFileSelect(file) {
  // Validate file type
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (!validTypes.includes(file.type)) {
    alert('Please upload a PDF or DOCX file.');
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB.');
    return;
  }

  uploadedFile = file;
  uploadPlaceholder.style.display = 'none';
  uploadSuccess.style.display = 'block';
  uploadFilename.textContent = file.name;

  checkFormValid();
}

// ============================================
// Job Description Handlers
// ============================================

jobDescriptionInput.addEventListener('input', (e) => {
  const length = e.target.value.length;
  charCount.textContent = `${length} characters`;
  checkFormValid();
});

// ============================================
// Form Validation
// ============================================

function checkFormValid() {
  const hasFile = uploadedFile !== null;
  const hasJD = jobDescriptionInput.value.trim().length >= 50;

  analyzeButton.disabled = !(hasFile && hasJD);
}

// ============================================
// Analysis Handler
// ============================================

analyzeButton.addEventListener('click', async () => {
  if (!uploadedFile || !jobDescriptionInput.value.trim()) {
    return;
  }

  // Show loading view
  inputView.style.display = 'none';
  heroSection.style.display = 'none';
  featuresSection.style.display = 'none';
  loadingView.style.display = 'block';
  resultsView.style.display = 'none';

  // Simulate loading steps
  const steps = [
    'Parsing resume file...',
    'Extracting job requirements...',
    'Matching skills and experience...',
    'Calculating compatibility score...',
    'Generating detailed analysis...'
  ];

  let currentStep = 0;
  const stepInterval = setInterval(() => {
    if (currentStep < steps.length) {
      loadingSteps.textContent = steps[currentStep];
      currentStep++;
    }
  }, 800);

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('resume', uploadedFile);
    formData.append('jobDescription', jobDescriptionInput.value.trim());

    // Call API
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    clearInterval(stepInterval);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Analysis failed');
    }

    const result = await response.json();

    // Show results
    displayResults(result);

  } catch (error) {
    clearInterval(stepInterval);
    loadingView.style.display = 'none';
    inputView.style.display = 'block';

    alert(`Error: ${error.message}\n\nPlease try again or check your inputs.`);
    console.error('Analysis error:', error);
  }
});

// ============================================
// Results Display
// ============================================

// ============================================
// Results Display (Updated for Phase 10)
// ============================================

function displayResults(result) {
  loadingView.style.display = 'none';
  resultsView.style.display = 'block';

  // Parse Advanced Insights
  const ai = result.advancedInsights || {};
  const confidence = result.confidence || {};

  const html = `
    <div class="results-header">
      <h2 class="hero-title">
        Your Compatibility Score: <span class="gradient-text">${result.score}%</span>
      </h2>
      <p class="hero-subtitle">${result.scoreLabel}</p>
      <div class="confidence-band">
        Confidence: ${result.score} ± ${confidence.range || 5} (Based on ${confidence.level || 'High'} data quality)
      </div>
    </div>
    
    ${renderScoreGauge(result.score, result.scoreColor)}
    
    <!-- Feature 1: Why ATS Rejection -->
    ${renderRejectionAnalysis(ai.whyAtsMayReject)}

    <!-- Feature 4: Readiness Meter -->
    ${renderReadinessMeter(ai.readinessMeter)}
    
    <!-- Feature 6: Dual Views -->
    ${renderDualViews(ai.dualViews)}

    <!-- Feature 3: Skill Evidence -->
    ${renderSkillEvidence(ai.skillEvidence)}

    <!-- Feature 5: Risk Flags -->
    ${renderRiskFlags(ai.riskFlags)}

    <!-- Feature 2: Improvement Suggestions -->
    ${renderSuggestions(ai.improvementSuggestions)}

    <!-- Feature 7: Checklist -->
    ${renderChecklist(ai.checklist)}
    
    ${renderSummary(result.explanation.summary)}
    ${renderBreakdown(result.breakdown, result.explanation.scoreJustification)}
  `;

  resultsContent.innerHTML = html;

  // Animate score gauge
  animateScoreGauge(result.score);
}

// --- Render Functions for New Features ---

function renderRejectionAnalysis(data) {
  if (!data || data.reasons.length === 0) return '';
  return `
    <div class="section-card rejection-card">
      <h3 class="section-title" style="color: var(--color-error);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        Why ATS May Reject This Resume
      </h3>
      <p style="margin-bottom: 1rem; color: var(--color-text-secondary);">${data.summary}</p>
      ${data.reasons.map(Reason => `
        <div class="list-item" style="border-left-color: var(--color-error);">
          <div style="display:flex; justify-content:space-between;">
             <span class="rejection-badge">${Reason.severity}</span>
             <span style="color: var(--color-error); font-weight:700;">-${Reason.impact}</span>
          </div>
          <h4 style="margin: 0.5rem 0;">${Reason.reason}</h4>
          <p style="font-size: 0.9rem; color: var(--color-text-muted);">${Reason.details}</p>
        </div>
      `).join('')}
    </div>`;
}

function renderReadinessMeter(meter) {
  if (!meter) return '';

  const renderBar = (label, data, color) => `
      <div class="meter-container">
        <div class="meter-header">
           <span>${label}</span>
           <span style="color:${color}; font-weight:700;">${data.score}/100</span>
        </div>
        <div class="meter-bar-bg">
           <div class="meter-bar-fill" style="width: ${data.score}%; background: ${color};"></div>
        </div>
        <p style="font-size:0.8rem; color:var(--color-text-muted); margin-top:0.25rem;">${data.label}</p>
      </div>
    `;

  return `
    <div class="section-card">
      <h3 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        Resume Readiness Meter
      </h3>
      ${renderBar('ATS Compatibility', meter.atsCompatibility, 'var(--color-purple-500)')}
      ${renderBar('Recruiter Readability', meter.recruiterReadability, 'var(--color-blue-500)')}
      ${renderBar('Evidence Strength', meter.evidenceStrength, 'var(--color-success)')}
      <p style="font-size:0.85rem; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1);">
         <strong>Note:</strong> These are 3 independent dimensions. A high ATS score doesn't always mean high readability.
      </p>
    </div>`;
}

function renderDualViews(views) {
  if (!views) return '';
  return `
    <div class="section-card">
      <h3 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
        </svg>
        Dual Perspective Analysis
      </h3>
      <div class="dual-view-container">
         <div class="view-column">
            <h4 style="color:var(--color-purple-500); margin-bottom:0.5rem;">🤖 ATS Protocol (Strict)</h4>
            <p style="font-size:0.9rem; margin-bottom:1rem;">${views.atsView.summary}</p>
            <ul style="padding-left:1.2rem; font-size:0.9rem; color:var(--color-text-secondary);">
               ${views.atsView.keyPoints.map(p => `<li>${p}</li>`).join('')}
            </ul>
            <div style="margin-top:1rem; font-weight:700;">Verdict: ${views.atsView.verdict}</div>
         </div>
         <div class="view-column">
            <h4 style="color:var(--color-blue-500); margin-bottom:0.5rem;">👤 Recruiter View (Human)</h4>
            <p style="font-size:0.9rem; margin-bottom:1rem;">${views.recruiterView.summary}</p>
             <ul style="padding-left:1.2rem; font-size:0.9rem; color:var(--color-text-secondary);">
               ${views.recruiterView.observations.map(p => `<li>${p}</li>`).join('')}
            </ul>
             <div style="margin-top:1rem; font-weight:700;">Verdict: ${views.recruiterView.recommendation}</div>
         </div>
      </div>
    </div>`;
}

function renderSkillEvidence(evidence) {
  if (!evidence || !evidence.summary) return '';

  // Helper to list skills
  const getSkillsByStrength = (strength) => {
    return evidence.details
      .filter(e => e.strength === strength)
      .map(e => `<span class="skill-tag">${e.skill}</span>`)
      .join('');
  };

  const strongSkills = getSkillsByStrength('STRONG');
  const weakSkills = getSkillsByStrength('WEAK') + getSkillsByStrength('MODERATE');
  const missingSkills = getSkillsByStrength('MISSING');

  return `
    <div class="section-card">
       <h3 class="section-title">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
         </svg>
         Skill Evidence Strength
       </h3>
       <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:1rem;">
          <!-- Strong -->
          <div class="evidence-col" style="background:rgba(16,185,129,0.05); padding:0.75rem; border-radius:8px; border:1px solid rgba(16,185,129,0.1);">
             <div style="font-weight:700; color:var(--color-success); margin-bottom:0.5rem; display:flex; justify-content:space-between;">
                STRONG <span>${evidence.summary.strong}</span>
             </div>
             <div class="skill-cloud">${strongSkills || '<em style="font-size:0.8rem; opacity:0.6;">None</em>'}</div>
          </div>

          <!-- Weak/Moderate -->
          <div class="evidence-col" style="background:rgba(245,158,11,0.05); padding:0.75rem; border-radius:8px; border:1px solid rgba(245,158,11,0.1);">
             <div style="font-weight:700; color:var(--color-warning); margin-bottom:0.5rem; display:flex; justify-content:space-between;">
                WEAK / MOD <span>${evidence.summary.moderate + evidence.summary.weak}</span>
             </div>
             <div class="skill-cloud">${weakSkills || '<em style="font-size:0.8rem; opacity:0.6;">None</em>'}</div>
          </div>

          <!-- Missing -->
          <div class="evidence-col" style="background:rgba(239,68,68,0.05); padding:0.75rem; border-radius:8px; border:1px solid rgba(239,68,68,0.1);">
             <div style="font-weight:700; color:var(--color-error); margin-bottom:0.5rem; display:flex; justify-content:space-between;">
                MISSING <span>${evidence.summary.missing}</span>
             </div>
             <div class="skill-cloud">${missingSkills || '<em style="font-size:0.8rem; opacity:0.6;">None</em>'}</div>
          </div>
       </div>
       <p style="font-size:0.85rem; color:var(--color-text-secondary); margin-top:0.5rem;">
         <strong>Strong:</strong> Found in Experience/Projects. <strong>Weak:</strong> List only. <strong>Missing:</strong> Not found in evidence check.
       </p>
    </div>`;
}

function renderRiskFlags(flags) {
  if (!flags || flags.length === 0) return '';
  return `
    <div class="section-card">
       <h3 class="section-title">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>
         </svg>
         Recruiter Risk Flags
       </h3>
       <div class="risk-grid">
          ${flags.map(flag => `
            <div class="risk-card">
               <div style="color:var(--color-warning); font-weight:700; margin-bottom:0.5rem;">⚠️ ${flag.flag}</div>
               <p style="font-size:0.9rem; margin-bottom:0.5rem;">${flag.explanation}</p>
               <p style="font-size:0.8rem; color:var(--color-text-muted);">💡 Fix: ${flag.recommendation}</p>
            </div>
          `).join('')}
       </div>
    </div>`;
}

function renderSuggestions(suggestions) {
  if (!suggestions || suggestions.length === 0) return '';
  return `
    <div class="section-card">
      <h3 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        Actionable Improvement Plan (Gap Resolver)
      </h3>
      <div style="overflow-x:auto;">
        <table class="gap-matrix">
          <thead>
            <tr>
              <th style="width: 25%">Missing / Issue</th>
              <th style="width: 25%">Where to Add</th>
              <th style="width: 50%">Action & Example</th>
            </tr>
          </thead>
          <tbody>
            ${suggestions.map(s => {
    const badgeClass = s.priority === 'CRITICAL' ? 'gap-critical' :
      s.priority === 'HIGH' ? 'gap-high' : 'gap-medium';
    return `
                <tr>
                   <td>
                      <span class="gap-item-badge ${badgeClass}">${s.type}</span>
                      <div style="font-weight:700; color:var(--color-text-primary); margin-top:0.25rem;">${s.item}</div>
                      <div style="font-size:0.8rem; color:var(--color-text-muted);">${s.issue}</div>
                   </td>
                   <td>
                      <span class="gap-location">${s.location}</span>
                      <div style="font-size:0.8rem; color:var(--color-text-muted);">Impact: <span style="color:var(--color-success);">${s.impact}</span></div>
                   </td>
                   <td>
                      <div style="margin-bottom:0.25rem;">${s.action}</div>
                      ${s.example ? `
                        <div class="gap-example-box" onclick="navigator.clipboard.writeText('${s.example.replace(/'/g, "\\'")}')" style="cursor:pointer;" title="Click to copy">
                           <span style="display:block; font-size:0.75rem; color:var(--color-purple-500); margin-bottom:0.2rem;">EXAMPLE (Click to Copy):</span>
                           "${s.example}"
                        </div>
                      ` : ''}
                   </td>
                </tr>
                `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderChecklist(checklist) {
  if (!checklist || checklist.items.length === 0) return '';
  return `
    <div class="section-card">
       <h3 class="section-title">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
         </svg>
         "Before You Apply" Checklist
       </h3>
       <div style="margin-bottom:1rem; font-weight:700; color:${checklist.summary.readiness === 100 ? 'var(--color-success)' : 'var(--color-warning)'}">
          Readiness: ${checklist.summary.readiness}% (${checklist.summary.message})
       </div>
       <div class="checklist-container">
          ${checklist.items.map(item => `
             <div class="checklist-item ${item.status === 'DONE' ? 'done' : 'todo'}" style="opacity: ${item.status === 'DONE' ? '0.7' : '1'}">
                <div class="checklist-checkbox">
                   ${item.status === 'DONE' ? '✓' : ''}
                </div>
                <div class="checklist-content">
                   <div style="font-weight:600; ${item.status === 'DONE' ? 'text-decoration:line-through;' : ''}">${item.item}</div>
                   <div style="font-size:0.85rem; color:var(--color-text-secondary);">${item.description}</div>
                </div>
                ${item.status !== 'DONE' ? `<div style="font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px; background:rgba(239,68,68,0.1); color:var(--color-error);">${item.priority}</div>` : ''}
             </div>
          `).join('')}
       </div>
    </div>`;
}

// Keep existing helpers: renderScoreGauge, animateScoreGauge, renderSummary, renderBreakdown
// But remove renderSection since we broke it apart into specific renderers

function renderScoreGauge(score, color) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return `
    <div class="score-gauge-container">
      <svg width="300" height="300" viewBox="0 0 300 300">
        <!-- Background circle -->
        <circle
          cx="150"
          cy="150"
          r="${radius}"
          fill="none"
          stroke="rgba(139, 92, 246, 0.1)"
          stroke-width="20"
        />
        <!-- Progress circle -->
        <circle
          id="scoreCircle"
          cx="150"
          cy="150"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="20"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          transform="rotate(-90 150 150)"
          style="transition: stroke-dashoffset 2s ease-in-out;"
        />
        <!-- Score text -->
        <text x="150" y="150" text-anchor="middle" dy="0.3em" font-size="64" font-weight="800" fill="${score >= 80 ? '#4ADE80' : score >= 60 ? '#FACC15' : '#F87171'}">
          ${score}
        </text>
        <text x="150" y="190" text-anchor="middle" font-size="20" fill="#9CA3AF">
          out of 100
        </text>
      </svg>
    </div>
  `;
}

function animateScoreGauge(score) {
  const circle = document.getElementById('scoreCircle');
  if (circle) {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 100);
  }
}

function renderSummary(summary) {
  return `
    <div class="section-card">
      <h3 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Summary
      </h3>
      <p style="color: var(--color-text-secondary); line-height: 1.8;">${summary}</p>
    </div>
  `;
}

function renderBreakdown(breakdown, justification) {
  return `
    <div class="section-card">
      <h3 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        Score Breakdown
      </h3>
      <div class="breakdown-grid">
        ${justification.breakdown.map(item => `
          <div class="breakdown-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4 style="font-weight: 700; color: var(--color-text-primary);">${item.category}</h4>
              <span style="font-weight: 700; font-size: 1.25rem; color: var(--color-purple-500);">
                ${item.earned}/${item.possible}
              </span>
            </div>
            <div style="background: rgba(139, 92, 246, 0.1); border-radius: 0.5rem; height: 8px; overflow: hidden; margin-bottom: 0.5rem;">
              <div style="background: linear-gradient(90deg, var(--color-purple-500), var(--color-blue-500)); height: 100%; width: ${item.percentage}%; transition: width 1s ease-in-out;"></div>
            </div>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">${item.explanation}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Back Button & Init code remains unchanged
backButton.addEventListener('click', () => {
  resultsView.style.display = 'none';
  inputView.style.display = 'block';
  heroSection.style.display = 'block';
  featuresSection.style.display = 'block';

  // Reset form
  uploadedFile = null;
  uploadPlaceholder.style.display = 'block';
  uploadSuccess.style.display = 'none';
  resumeFileInput.value = '';
  jobDescriptionInput.value = '';
  charCount.textContent = '0 characters';
  analyzeButton.disabled = true;
});

console.log('🎯 ATS Compatibility Checker initialized');
console.log('📊 Strict scoring mode enabled');
