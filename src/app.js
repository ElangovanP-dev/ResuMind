/**
 * ══════════════════════════════════════════════════════════════════
 * RESUMIND — MAIN APPLICATION CONTROLLER
 * File: /src/app.js
 * ══════════════════════════════════════════════════════════════════
 * Orchestrates:
 *  - ThreeScene initialization and render lifecycle
 *  - GSAP ScrollTrigger timeline for 3D exploded view & camera choreography
 *  - Screen-space 3D hotspot projection and animation
 *  - Floating HUD Mode toggle (Scroll Mode vs. 360° Orbit Mode)
 *  - Authentication modal interaction and validation
 *  - Seamless transitions between Ingestion (upload.js) and Telemetry (dashboard.js)
 */

import { ThreeScene } from './three-scene.js';
import { initUploadModule } from './upload.js';
import { initDashboardModule, renderDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP plugins
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ── 1. INITIALIZE THREE.JS 3D SCENE ──
  const canvas = document.getElementById('webgl-canvas');
  let threeScene = null;

  if (canvas) {
    threeScene = new ThreeScene(canvas);
  }

  // ── 2. BIND GSAP SCROLLTRIGGER FOR 3D EXPLODED JOURNEY ──
  initScrollJourney(threeScene);

  // ── 3. WIRE UP FLOATING HUD CONTROLS ──
  initHudControls(threeScene);

  // ── 4. WIRE UP AUTHENTICATION MODAL ──
  initAuthModal();

  // ── 5. INITIALIZE UPLOAD INGESTION MODULE ──
  initUploadModule({
    onUploadComplete: (mockData) => {
      // Smoothly transition and scroll down to dashboard section
      renderDashboard(mockData);
      const dashSection = document.getElementById('dashboard-section');
      if (dashSection) {
        dashSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // ── 6. INITIALIZE DASHBOARD MODULE WITH INITIAL DEMO DATA ──
  initDashboardModule();

  // Demo CTA Trigger: jump directly to populated dashboard
  const btnViewDemo = document.getElementById('btn-view-demo');
  if (btnViewDemo) {
    btnViewDemo.addEventListener('click', () => {
      renderDashboard(); // Loads built-in realistic mock dataset
      const dashSection = document.getElementById('dashboard-section');
      if (dashSection) {
        dashSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});

/**
 * Maps GSAP ScrollTrigger timeline progression directly to Three.js exploded view.
 * @param {ThreeScene} scene - Active Three.js scene instance
 */
function initScrollJourney(scene) {
  if (!scene || !window.ScrollTrigger) return;

  const pinContainer = document.getElementById('hero-journey');
  const stage1 = document.getElementById('journey-stage-1');
  const stage2 = document.getElementById('journey-stage-2');
  const stage3 = document.getElementById('journey-stage-3');
  const stage4 = document.getElementById('journey-stage-4');

  const hotspotATS = document.getElementById('hotspot-ats');
  const hotspotSkills = document.getElementById('hotspot-skills');
  const hotspotVerbs = document.getElementById('hotspot-verbs');
  const hotspotMatrix = document.getElementById('hotspot-matrix');

  // Master Pinning Timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pinContainer,
      start: 'top top',
      end: '+=350%',
      pin: true,
      scrub: 1.2,
      onUpdate: (self) => {
        // Pass scroll progress directly to 3D explosion geometry
        scene.setExplosionProgress(self.progress);

        // Update 2D screen positions for 3D projected hotspots
        const projected = scene.getProjectedHotspots();
        updateHotspotPosition(hotspotATS, projected.ats);
        updateHotspotPosition(hotspotSkills, projected.skills);
        updateHotspotPosition(hotspotVerbs, projected.verbs);
        updateHotspotPosition(hotspotMatrix, projected.matrix);
      }
    }
  });

  // ── SEQUENCE PROGRESSION ──
  // 1. Stage 1 fades out as scroll starts
  tl.to(stage1, { opacity: 0, y: -40, duration: 0.6, ease: 'power2.inOut' }, 0);

  // 2. Stage 2 (Top Shell) fades in and out
  tl.to(stage2, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.6);
  tl.to(hotspotVerbs, { opacity: 1, duration: 0.4 }, 0.8);
  tl.to(stage2, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 1.5);
  tl.to(hotspotVerbs, { opacity: 0, duration: 0.3 }, 1.5);

  // 3. Stage 3 (Core Matrix & Score Engine)
  tl.to(stage3, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 1.6);
  tl.to([hotspotATS, hotspotSkills], { opacity: 1, duration: 0.4 }, 1.8);
  tl.to(stage3, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 2.5);
  tl.to([hotspotATS, hotspotSkills], { opacity: 0, duration: 0.3 }, 2.5);

  // 4. Stage 4 (Base Validation Grid)
  tl.to(stage4, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 2.6);
  tl.to(hotspotMatrix, { opacity: 1, duration: 0.4 }, 2.8);
  tl.to(stage4, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 3.4);
  tl.to(hotspotMatrix, { opacity: 0, duration: 0.3 }, 3.4);
}

/**
 * Translates an HTML hotspot element using projected 2D coordinates.
 * @param {HTMLElement} element - Target hotspot DOM element
 * @param {Object} coords - Screen coordinates { x, y, visible }
 */
function updateHotspotPosition(element, coords) {
  if (!element || !coords) return;
  element.style.left = `${coords.x}px`;
  element.style.top = `${coords.y}px`;
  element.style.visibility = coords.visible ? 'visible' : 'hidden';
}

/**
 * Handles toggling between Scroll-driven storytelling and 360° free Orbit mode.
 * @param {ThreeScene} scene - Active Three.js scene instance
 */
function initHudControls(scene) {
  const btnScroll = document.getElementById('btn-scroll-mode');
  const btnOrbit = document.getElementById('btn-orbit-mode');
  if (!btnScroll || !btnOrbit || !scene) return;

  btnScroll.addEventListener('click', () => {
    scene.setOrbitMode(false);
    btnScroll.className = 'px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/40 shadow-sm';
    btnOrbit.className = 'px-3 py-1.5 rounded-full text-xs font-mono font-medium text-slate-400 hover:text-white transition-all';
  });

  btnOrbit.addEventListener('click', () => {
    scene.setOrbitMode(true);
    btnOrbit.className = 'px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/40 shadow-sm';
    btnScroll.className = 'px-3 py-1.5 rounded-full text-xs font-mono font-medium text-slate-400 hover:text-white transition-all';
  });
}

/**
 * Initializes the modal authentication portal with form validation and tab switching.
 */
function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  const modalCard = document.getElementById('auth-modal-card');
  const btnOpen = document.getElementById('btn-open-auth');
  const btnClose = document.getElementById('btn-close-auth');

  const tabSignIn = document.getElementById('tab-signin');
  const tabRegister = document.getElementById('tab-register');
  const confirmWrapper = document.getElementById('confirm-password-wrapper');
  const btnSubmit = document.getElementById('btn-auth-submit');

  const form = document.getElementById('auth-form');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const confirmInput = document.getElementById('auth-confirm-password');

  const emailError = document.getElementById('auth-email-error');
  const passwordError = document.getElementById('auth-password-error');
  const confirmError = document.getElementById('auth-confirm-error');

  let isRegisterMode = false;

  const openModal = () => {
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100');
    modalCard.classList.remove('scale-95');
    modalCard.classList.add('scale-100');
  };

  const closeModal = () => {
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.remove('opacity-100');
    modalCard.classList.add('scale-95');
    modalCard.classList.remove('scale-100');
  };

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);

  // Close when clicking outside of the modal card
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
      closeModal();
    }
  });

  // Tab switching: Sign In vs Register
  tabSignIn.addEventListener('click', () => {
    isRegisterMode = false;
    tabSignIn.className = 'text-sm font-mono font-bold text-accent-cyan border-b-2 border-accent-cyan pb-2 -mb-4 transition-colors';
    tabRegister.className = 'text-sm font-mono font-medium text-slate-400 hover:text-white pb-2 -mb-4 transition-colors ml-4';
    confirmWrapper.classList.add('hidden');
    btnSubmit.textContent = 'Sign In to ResuMind';
  });

  tabRegister.addEventListener('click', () => {
    isRegisterMode = true;
    tabRegister.className = 'text-sm font-mono font-bold text-accent-cyan border-b-2 border-accent-cyan pb-2 -mb-4 transition-colors ml-4';
    tabSignIn.className = 'text-sm font-mono font-medium text-slate-400 hover:text-white pb-2 -mb-4 transition-colors';
    confirmWrapper.classList.remove('hidden');
    btnSubmit.textContent = 'Create ResuMind Account';
  });

  // Client-side real-time validation
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let hasError = false;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      emailError.textContent = 'Valid email address required';
      emailError.classList.remove('hidden');
      hasError = true;
    } else {
      emailError.classList.add('hidden');
    }

    // Password validation
    if (!passwordInput.value || passwordInput.value.length < 8) {
      passwordError.textContent = 'Password must be at least 8 characters';
      passwordError.classList.remove('hidden');
      hasError = true;
    } else {
      passwordError.classList.add('hidden');
    }

    // Confirm password validation (register mode)
    if (isRegisterMode) {
      if (confirmInput.value !== passwordInput.value) {
        confirmError.textContent = 'Passwords do not match';
        confirmError.classList.remove('hidden');
        hasError = true;
      } else {
        confirmError.classList.add('hidden');
      }
    }

    if (!hasError) {
      btnSubmit.textContent = 'Authenticating...';
      setTimeout(() => {
        btnSubmit.textContent = '✓ Welcome to ResuMind';
        setTimeout(() => {
          closeModal();
          btnSubmit.textContent = isRegisterMode ? 'Create ResuMind Account' : 'Sign In to ResuMind';
        }, 800);
      }, 700);
    }
  });
}
