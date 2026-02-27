/**
 * render.js
 *
 * PURPOSE:
 * Takes the structured JSON from the AI and renders
 * it as a formatted, print-ready resume HTML.
 *
 * This separation matters because:
 * - The AI generates CONTENT (data)
 * - This file handles PRESENTATION (formatting)
 * - You can change the visual template without touching the AI logic
 *
 * The output format matches the LaTeX template provided —
 * same section order, same spacing philosophy, ATS-friendly.
 */

const RENDER = {

  /**
   * Main entry point: renders the full resume HTML
   * into the #resume-output element
   */
  renderResume(data) {
    const container = document.getElementById('resume-output');
    container.innerHTML = this.buildResumeHTML(data);
  },

  /**
   * Builds the complete resume HTML string
   * Matches the LaTeX format: Name → Contact → Education →
   * Skills → Experience → Projects
   */
  buildResumeHTML(d) {
    return `
      ${this.section_header(d)}
      ${this.section_education(d.education)}
      ${this.section_skills(d.skills)}
      ${this.section_experience(d.experience)}
      ${this.section_projects(d.projects)}
    `;
  },

  /* ── Header: Name + Contact ──────────────── */
  section_header(d) {
    const c = d.contact || {};
    const parts = [
      c.phone,
      c.email   ? `<a href="mailto:${c.email}">${c.email}</a>` : null,
      c.linkedin ? `<a href="${c.linkedin}" target="_blank">LinkedIn</a>` : null,
      c.github   ? `<a href="${c.github}" target="_blank">GitHub</a>` : null,
    ].filter(Boolean);

    return `
      <div class="r-name">${this.val(d.name, 'YOUR NAME')}</div>
      <div class="r-contact">${parts.join(' &nbsp;|&nbsp; ')}</div>
    `;
  },

  /* ── Education ────────────────────────────── */
  section_education(education) {
    if (!education || education.length === 0) return '';

    const items = education.map(e => `
      <div class="r-item">
        <div class="r-item-header">
          <span class="r-item-title">${this.val(e.degree, '[Degree Title]')}</span>
          <span class="r-item-date">${this.val(e.start, 'Start Date')} – ${this.val(e.end, 'End Date')}</span>
        </div>
        <div class="r-item-sub">
          ${this.val(e.school, '[University Name]')}${e.gpa ? ` | GPA: ${e.gpa}` : ''} &nbsp;·&nbsp; ${this.val(e.location, '[Location]')}
        </div>
        ${e.coursework ? `<div class="r-item-sub">Relevant Coursework: ${e.coursework}</div>` : ''}
      </div>
    `).join('');

    return this.wrapSection('EDUCATION', items);
  },

  /* ── Technical Skills ─────────────────────── */
  section_skills(skills) {
    if (!skills) return '';

    const rows = Object.entries(skills)
      .filter(([, v]) => v)
      .map(([k, v]) => `
        <div class="r-skills-row">
          <strong>${k}:</strong> ${v}
        </div>
      `).join('');

    return this.wrapSection('TECHNICAL SKILLS', rows);
  },

  /* ── Work Experience ──────────────────────── */
  section_experience(experience) {
    if (!experience || experience.length === 0) return '';

    const items = experience.map(exp => `
      <div class="r-item">
        <div class="r-item-header">
          <span class="r-item-title">${this.val(exp.title, '[Job Title]')}</span>
          <span class="r-item-date">${this.val(exp.start, 'Start')} – ${this.val(exp.end, 'Present')}</span>
        </div>
        <div class="r-item-sub">
          ${this.val(exp.company, '[Company Name]')}${exp.location ? ` · ${exp.location}` : ''}
        </div>
        ${exp.tech ? `<div class="r-item-tech">${exp.tech}</div>` : ''}
        <ul>
          ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return this.wrapSection('WORK EXPERIENCE', items);
  },

  /* ── Projects ─────────────────────────────── */
  section_projects(projects) {
    if (!projects || projects.length === 0) return '';

    const items = projects.map(p => `
      <div class="r-item">
        <div class="r-item-header">
          <span class="r-item-title">
            ${this.val(p.name, '[Project Name]')}
            ${p.tech ? ` <span style="font-weight:400;color:#555;">| ${p.tech}</span>` : ''}
          </span>
          ${p.link ? `<a href="${p.link}" target="_blank" style="font-size:11px;color:#0000EE;">↗ Link</a>` : ''}
        </div>
        <ul>
          ${(p.bullets || []).map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return this.wrapSection('PROJECTS', items);
  },

  /* ── Helpers ──────────────────────────────── */

  /**
   * Wraps content in a named section with divider
   */
  wrapSection(title, content) {
    return `
      <div class="r-section">
        <div class="r-section-title">${title}</div>
        ${content}
      </div>
    `;
  },

  /**
   * Returns value or a styled placeholder if missing/empty
   */
  val(value, placeholder) {
    if (value && value.trim() && value !== 'null' && value !== 'undefined') {
      return value;
    }
    return `<span class="placeholder">[${placeholder}]</span>`;
  },

  /**
   * Renders the ATS score banner
   */
  renderATSBanner(resumeData) {
    const score = resumeData.ats_score || 85;
    const keywords = resumeData.matched_keywords || [];

    document.getElementById('ats-score').textContent = score + '%';

    // Animate bar
    setTimeout(() => {
      document.getElementById('ats-bar').style.width = score + '%';
    }, 100);

    // Render keyword tags
    const tagsEl = document.getElementById('ats-tags');
    tagsEl.innerHTML = keywords
      .map(kw => `<span class="ats-keyword">✓ ${kw}</span>`)
      .join('');
  },

  /**
   * Renders the cover letter into its pane
   */
  renderCoverLetter(text) {
    document.getElementById('cover-output').textContent = text;
  },

  /**
   * Renders the HR message into its pane
   */
  renderHRMessage(text) {
    document.getElementById('hr-output').textContent = text;
  }

};
