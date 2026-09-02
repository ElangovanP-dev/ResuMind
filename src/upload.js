/**
 * ══════════════════════════════════════════════════════════════════
 * RESUMIND — UPLOAD & INGESTION INTERFACE MODULE
 * File: /src/upload.js
 * ══════════════════════════════════════════════════════════════════
 * Features:
 *  - Drag-and-drop ingestion zone with GSAP hover scale & border styling
 *  - Hidden input fallback for click-to-browse
 *  - Client-side validation: MIME type check (.pdf, .docx) & 10MB file limit
 *  - Rejection animation (GSAP shake + error prompt)
 *  - GSAP progress bar simulation (0% to 100% over ~1.5 seconds)
 *  - Transition into processing status followed by dashboard disclosure
 */

export function initUploadModule({ onUploadComplete } = {}) {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const dropPrompt = document.getElementById('drop-prompt');
  const progressState = document.getElementById('upload-progress-state');
  const progressBar = document.getElementById('upload-progress-bar');
  const statusText = document.getElementById('upload-status-text');
  const fileNameDisplay = document.getElementById('file-name-display');
  const fileSizeDisplay = document.getElementById('file-size-display');
  const errorBox = document.getElementById('upload-error-box');

  if (!dropZone || !fileInput) return;

  // Maximum file size: 10 Megabytes in bytes
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['pdf', 'docx'];

  // Trigger file input when clicking anywhere on the drop zone
  dropZone.addEventListener('click', (e) => {
    // Avoid re-triggering if clicking on a button or already processing
    if (!progressState.classList.contains('hidden')) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // ── DRAG & DROP EVENTS WITH GSAP HOVER SCALE ──
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
      gsap.to(dropZone, { scale: 1.015, duration: 0.25, ease: 'power2.out' });
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
      gsap.to(dropZone, { scale: 1.0, duration: 0.25, ease: 'power2.out' });
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      handleFileSelection(dt.files[0]);
    }
  });

  /**
   * Validates file properties, handles rejection, or initiates ingestion pipeline.
   * @param {File} file - Selected or dropped File object
   */
  function handleFileSelection(file) {
    // Clear any previous error states
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    const extension = file.name.split('.').pop().toLowerCase();

    // 1. Validate file extension
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      triggerRejection(`Invalid format (.${extension}). Only PDF or DOCX files are supported.`);
      return;
    }

    // 2. Validate maximum file size (10MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      triggerRejection(`File exceeds 10MB limit (Current: ${sizeMB} MB). Please compress your file.`);
      return;
    }

    // File is valid: proceed to ingestion animation
    startIngestionSequence(file);
  }

  /**
   * Triggers an animated error shake using GSAP and presents an error banner.
   * @param {string} message - Error notification text
   */
  function triggerRejection(message) {
    errorBox.textContent = `✕ ${message}`;
    errorBox.classList.remove('hidden');

    // Horizontal shake sequence
    gsap.fromTo(dropZone,
      { x: -10 },
      { x: 10, duration: 0.08, repeat: 5, yoyo: true, ease: 'power1.inOut', onComplete: () => {
        gsap.to(dropZone, { x: 0, duration: 0.1 });
      }}
    );
  }

  /**
   * Simulates progress bar upload, status steps, and executes completion callback.
   * @param {File} file - Validated resume file
   */
  function startIngestionSequence(file) {
    // Display file metadata
    fileNameDisplay.textContent = file.name;
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    fileSizeDisplay.textContent = `${formattedSize} · ${file.name.split('.').pop().toUpperCase()}`;

    // Switch view to progress state
    dropPrompt.classList.add('hidden');
    progressState.classList.remove('hidden');

    const progressObj = { value: 0 };

    // GSAP Progress Bar Animation over 1.6 seconds
    gsap.to(progressObj, {
      value: 100,
      duration: 1.6,
      ease: 'power1.inOut',
      onUpdate: () => {
        progressBar.style.width = `${progressObj.value}%`;
        if (progressObj.value < 40) {
          statusText.textContent = 'Ingesting document bytes...';
        } else if (progressObj.value < 75) {
          statusText.textContent = 'Extracting AST syntax nodes & taxonomy tags...';
        } else {
          statusText.textContent = 'Benchmarking against Greenhouse & Lever models...';
        }
      },
      onComplete: () => {
        statusText.textContent = '✓ Parsing Complete. Initializing Telemetry...';
        statusText.classList.remove('animate-pulse');
        statusText.classList.add('text-accent-mint');

        setTimeout(() => {
          if (typeof onUploadComplete === 'function') {
            onUploadComplete({
              fileName: file.name,
              fileSize: formattedSize,
              uploadedAt: new Date().toLocaleTimeString()
            });
          }
        }, 500);
      }
    });
  }

  // Reset ingestion state when user clicks "Scan Another Document"
  const btnScanAnother = document.getElementById('btn-scan-another');
  if (btnScanAnother) {
    btnScanAnother.addEventListener('click', () => {
      progressState.classList.add('hidden');
      dropPrompt.classList.remove('hidden');
      progressBar.style.width = '0%';
      statusText.classList.add('animate-pulse');
      statusText.classList.remove('text-accent-mint');
      fileInput.value = '';
      
      const uploadSec = document.getElementById('upload-section');
      if (uploadSec) {
        uploadSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
