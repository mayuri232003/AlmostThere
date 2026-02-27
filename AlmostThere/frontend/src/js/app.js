/**
 * app.js
 *
 * PURPOSE:
 * Main application controller. Orchestrates everything:
 * - Reads inputs from the UI
 * - Validates inputs
 * - Calls API layer sequentially (resume → cover letter → HR message)
 * - Updates progress UI
 * - Passes data to render layer
 * - Handles errors gracefully
 *
 * This is the "glue" file — it knows about the DOM
 * but delegates actual work to api.js, render.js, download.js.
 */


/* ══════════════════════════════════════
   UTILITY: Toast notifications
══════════════════════════════════════ */
const TOAST = {
  timer: null,

  show(message, type = '') {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = `toast show ${type}`;

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  }
};


/* ══════════════════════════════════════
   PROGRESS TRACKER
══════════════════════════════════════ */
const PROGRESS = {
  steps: ['ps-1', 'ps-2', 'ps-3', 'ps-4'],
  current: 0,

  show() {
    document.getElementById('progress-section').style.display = 'block';
    this.current = 0;
    this.steps.forEach(id => {
      const el = document.getElementById(id);
      el.className = 'pstep';
    });
    document.getElementById('progress-bar').style.width = '0%';
  },

  advance(stepIndex) {
    // Mark previous steps as done
    for (let i = 0; i < stepIndex; i++) {
      document.getElementById(this.steps[i]).className = 'pstep done';
    }
    // Mark current as active
    if (stepIndex < this.steps.length) {
      document.getElementById(this.steps[stepIndex]).className = 'pstep active';
    }
    // Update progress bar
    const pct = Math.round(((stepIndex + 0.5) / this.steps.length) * 100);
    document.getElementById('progress-bar').style.width = pct + '%';

    this.current = stepIndex;
  },

  complete() {
    this.steps.forEach(id => {
      document.getElementById(id).className = 'pstep done';
    });
    document.getElementById('progress-bar').style.width = '100%';

    setTimeout(() => {
      document.getElementById('progress-section').style.display = 'none';
    }, 800);
  }
};


/* ══════════════════════════════════════
   MAIN GENERATE FUNCTION
   Called when user clicks "Optimize My Application"
══════════════════════════════════════ */
async function generateAll() {
  // ── 1. Read inputs ──────────────────────────
  const resumeText     = document.getElementById('resume-input').value.trim();
  const jdText         = document.getElementById('jd-input').value.trim();
  const recruiterName  = document.getElementById('recruiter-name').value.trim();
  const companyName    = document.getElementById('company-name').value.trim();
  const roleName       = document.getElementById('role-name').value.trim();

  // ── 2. Validate ─────────────────────────────
  if (!resumeText) {
    TOAST.show('Please paste your resume text first.', 'error');
    document.getElementById('resume-input').focus();
    return;
  }

  if (!jdText) {
    TOAST.show('Please paste the job description.', 'error');
    document.getElementById('jd-input').focus();
    return;
  }

  if (resumeText.length < 100) {
    TOAST.show('Resume seems too short. Paste the full text.', 'error');
    return;
  }

  if (jdText.length < 100) {
    TOAST.show('Job description seems too short. Paste the full posting.', 'error');
    return;
  }

  // ── 3. Set loading state ─────────────────────
  const btn = document.getElementById('generate-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  // Hide previous results
  document.getElementById('results-section').style.display = 'none';

  // Show progress
  PROGRESS.show();
  scrollToProgress();

  try {

    // ── 4. STEP 1: Generate optimized resume ────
    PROGRESS.advance(0);
    const resumeResponse = await API.generateResume(resumeText, jdText);

    if (!resumeResponse.success) {
      throw new Error(resumeResponse.error || "Resume generation failed");
    }

    const resumeData = resumeResponse.data;

    // ── 5. STEP 2: Render resume ─────────────────
    PROGRESS.advance(1);
    RENDER.renderResume(resumeData);
    RENDER.renderATSBanner(resumeData);

    // ── 6. STEP 3: Generate cover letter ─────────
    PROGRESS.advance(2);
    // Use optimized resume bullets as context (richer input)
    const optimizedContext = buildOptimizedContext(resumeData);
    const coverResponse = await API.generateCoverLetter(
      optimizedContext, jdText, companyName, roleName
    );

    if (!coverResponse.success) {
      throw new Error(coverResponse.error || "Cover letter failed");
    }
    const coverLetter = coverResponse.data;
    RENDER.renderCoverLetter(coverLetter);

    // ── 7. STEP 4: Generate HR message ────────────
    PROGRESS.advance(3);
    const hrResponse = await API.generateHRMessage(
      optimizedContext, jdText, recruiterName, companyName, roleName
    );
    if (!hrResponse.success) {
      throw new Error(hrResponse.error || "HR message failed");
    }
    const hrMessage = hrResponse.data;
    RENDER.renderHRMessage(hrMessage);

    // ── 8. Complete ──────────────────────────────
    PROGRESS.complete();

    // Show results
    const resultsEl = document.getElementById('results-section');
    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    TOAST.show('✓ All 3 outputs generated!', 'success');

  } catch (error) {
    console.error('Generation error:', error);

    PROGRESS.complete();

    let errorMsg = 'Something went wrong. Please try again.';
    if (error.message.includes('401') || error.message.includes('auth')) {
      errorMsg = 'API authentication error. Check your API key.';
    } else if (error.message.includes('429')) {
      errorMsg = 'Rate limit hit. Wait a moment and try again.';
    } else if (error.message.includes('JSON')) {
      errorMsg = 'AI response format error. Please try again.';
    } else if (error.message) {
      errorMsg = error.message;
    }

    TOAST.show(errorMsg, 'error');
    document.getElementById('progress-section').style.display = 'none';

  } finally {
    // Always restore button state
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}


/* ══════════════════════════════════════
   HELPER: Build text context from JSON resume
   for use as input to cover letter / HR prompts
══════════════════════════════════════ */
function buildOptimizedContext(resumeData) {
  const lines = [];

  lines.push(`Name: ${resumeData.name || ''}`);
  lines.push(`Contact: ${JSON.stringify(resumeData.contact || {})}`);

  if (resumeData.education?.length) {
    lines.push('\nEDUCATION:');
    resumeData.education.forEach(e => {
      lines.push(`${e.degree} at ${e.school} (${e.start}–${e.end}) GPA: ${e.gpa || 'N/A'}`);
    });
  }

  if (resumeData.skills) {
    lines.push('\nSKILLS:');
    Object.entries(resumeData.skills).forEach(([k, v]) => {
      if (v) lines.push(`${k}: ${v}`);
    });
  }

  if (resumeData.experience?.length) {
    lines.push('\nEXPERIENCE:');
    resumeData.experience.forEach(exp => {
      lines.push(`${exp.title} at ${exp.company} (${exp.start}–${exp.end})`);
      (exp.bullets || []).forEach(b => lines.push(`• ${b}`));
    });
  }

  if (resumeData.projects?.length) {
    lines.push('\nPROJECTS:');
    resumeData.projects.forEach(p => {
      lines.push(`${p.name} (${p.tech})`);
      (p.bullets || []).forEach(b => lines.push(`• ${b}`));
    });
  }

  return lines.join('\n');
}


/* ══════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════ */
function switchResultTab(tabName, btn) {
  // Update tab buttons
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Update panes
  document.querySelectorAll('.result-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`pane-${tabName}`).classList.add('active');
}


/* ══════════════════════════════════════
   COPY TO CLIPBOARD
══════════════════════════════════════ */
function copyContent(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // For resume (HTML), get text content; for letters, get textContent
  const text = el.textContent || el.innerText;

  navigator.clipboard.writeText(text.trim())
    .then(() => TOAST.show('Copied to clipboard!', 'success'))
    .catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      TOAST.show('Copied!', 'success');
    });
}


/* ══════════════════════════════════════
   RESET APP
══════════════════════════════════════ */
function resetApp() {
  document.getElementById('resume-input').value = '';
  document.getElementById('jd-input').value = '';
  document.getElementById('recruiter-name').value = '';
  document.getElementById('company-name').value = '';
  document.getElementById('role-name').value = '';

  document.getElementById('results-section').style.display = 'none';
  document.getElementById('progress-section').style.display = 'none';
  document.getElementById('resume-counter').textContent = '0 characters';
  document.getElementById('jd-counter').textContent = '0 characters';

  scrollToApp();
  TOAST.show('Ready for your next application!', 'success');
}


/* ══════════════════════════════════════
   SCROLL HELPERS
══════════════════════════════════════ */
function scrollToApp() {
  document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
}

function scrollToProgress() {
  document.getElementById('progress-section').scrollIntoView({
    behavior: 'smooth', block: 'center'
  });
}


/* ══════════════════════════════════════
   CHARACTER COUNTERS
══════════════════════════════════════ */
function initCharCounters() {
  const resumeInput = document.getElementById('resume-input');
  const jdInput = document.getElementById('jd-input');

  resumeInput.addEventListener('input', () => {
    document.getElementById('resume-counter').textContent =
      `${resumeInput.value.length.toLocaleString()} characters`;
  });

  jdInput.addEventListener('input', () => {
    document.getElementById('jd-counter').textContent =
      `${jdInput.value.length.toLocaleString()} characters`;
  });
}


/* ══════════════════════════════════════
   TOGGLE HANDLERS
══════════════════════════════════════ */
function initToggleHandlers() {
  // Toggle tool items in the agent config (carried over from original)
  document.querySelectorAll('.toggle-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}


/* ══════════════════════════════════════
   INITIALIZE
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCharCounters();
  initToggleHandlers();

  // Add subtle input card visual focus states
  document.getElementById('resume-input').addEventListener('focus', () => {
    document.getElementById('resume-card').style.borderColor = 'var(--teal)';
  });
  document.getElementById('resume-input').addEventListener('blur', () => {
    document.getElementById('resume-card').style.borderColor = '';
  });
  document.getElementById('jd-input').addEventListener('focus', () => {
    document.getElementById('jd-card').style.borderColor = 'var(--teal)';
  });
  document.getElementById('jd-input').addEventListener('blur', () => {
    document.getElementById('jd-card').style.borderColor = '';
  });
});
