/**
 * download.js
 *
 * PURPOSE:
 * Handles downloading the resume as a print-ready PDF
 * and the cover letter as a plain text file.
 *
 * PDF approach: We use the browser's built-in print dialog
 * with a print-only stylesheet that hides everything except
 * the resume output. This gives clean, professional PDFs
 * without requiring a server or external library.
 *
 * For Word-style download: we use an HTML blob with
 * application/msword MIME type — opens cleanly in Word.
 */

const DOWNLOAD = {

  /**
   * Downloads the resume output as a PDF.
   * Opens browser print dialog configured for PDF export.
   */
  downloadResumePDF() {
    // Grab the resume HTML
    const resumeEl = document.getElementById('resume-output');
    if (!resumeEl || !resumeEl.innerHTML.trim()) {
      TOAST.show('No resume to download yet.', 'error');
      return;
    }

    // Build a minimal print page
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resume</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Figtree:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Georgia', serif;
            font-size: 10.5pt;
            line-height: 1.45;
            color: #111;
            padding: 0.5in;
          }
          .r-name {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 20pt;
            font-weight: 900;
            text-align: center;
            letter-spacing: 0.05em;
            margin-bottom: 4pt;
          }
          .r-contact {
            text-align: center;
            font-size: 9pt;
            color: #444;
            margin-bottom: 10pt;
          }
          .r-contact a { color: #0000EE; text-decoration: none; }
          .r-section { margin-top: 10pt; }
          .r-section-title {
            font-family: 'Figtree', sans-serif;
            font-size: 9.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-bottom: 1pt solid #111;
            padding-bottom: 1pt;
            margin-bottom: 6pt;
          }
          .r-item { margin-bottom: 7pt; }
          .r-item-header { display: flex; justify-content: space-between; }
          .r-item-title { font-weight: 700; font-size: 10.5pt; }
          .r-item-date { font-size: 9.5pt; color: #555; }
          .r-item-sub { font-size: 9.5pt; color: #444; margin-bottom: 2pt; }
          .r-item-tech { font-size: 9pt; color: #555; font-style: italic; margin-bottom: 2pt; }
          ul { margin-left: 14pt; margin-top: 2pt; }
          ul li { font-size: 10pt; margin-bottom: 1.5pt; line-height: 1.4; }
          .r-skills-row { font-size: 10pt; margin-bottom: 2pt; }
          .placeholder { color: #aaa; font-style: italic; }
          @page { margin: 0.5in; size: letter; }
        </style>
      </head>
      <body>
        ${resumeEl.innerHTML}
      </body>
      </html>
    `;

    // Open in new window and trigger print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Small delay to let fonts load
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 800);
  },

  /**
   * Downloads text content as a .txt file
   * Works for cover letter and HR message
   */
  downloadAsText(elementId, filename) {
    const el = document.getElementById(elementId);
    if (!el || !el.textContent.trim()) {
      TOAST.show('Nothing to download yet.', 'error');
      return;
    }

    const text = el.textContent;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();

    URL.revokeObjectURL(url);
    TOAST.show('Downloaded!', 'success');
  },

  /**
   * Downloads content as a Word-compatible HTML file
   * Most Word versions open .doc HTML files correctly
   */
  downloadAsDoc(elementId, filename) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const isResume = elementId === 'resume-output';
    const content = isResume ? el.innerHTML : `<p style="font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;white-space:pre-wrap;">${el.textContent}</p>`;

    const wordDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Calibri, sans-serif; font-size: 11pt; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `;

    const blob = new Blob([wordDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.doc`;
    a.click();

    URL.revokeObjectURL(url);
    TOAST.show('Downloaded as .doc!', 'success');
  }

};

/* ── Global download functions (called from HTML) ── */

function downloadResume() {
  DOWNLOAD.downloadResumePDF();
}

function downloadDoc(elementId, filename) {
  DOWNLOAD.downloadAsDoc(elementId, filename);
}
