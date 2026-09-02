/**
 * ══════════════════════════════════════════════════════════════════
 * RESUMIND — EXECUTIVE ANALYSIS DASHBOARD MODULE
 * File: /src/dashboard.js
 * ══════════════════════════════════════════════════════════════════
 * Features:
 *  - High-precision circular SVG gauge rendering with animated stroke-dashoffset
 *  - Synchronized numerical count-up easing
 *  - 2-Column Strengths (Mint) vs Critical Improvements (Amber) with priority badges
 *  - Interactive Semantic Keyword Cloud weighted by relevance & hover scale
 *  - Horizontal Skill Gap comparison bar charts with GSAP-animated widths
 *  - Extensible realistic mock data structure ready for backend API hydration
 */

// Realistic Sample Telemetry Dataset
export const MOCK_ANALYSIS_DATA = {
  scores: {
    atsScore: 94,          // Greenhouse & Lever ATS Compatibility
    matchPercentage: 88,   // Semantic Cosine Keyword Alignment
    readabilityScore: 91,  // Flesch-Kincaid Executive Brevity
  },
  strengths: [
    {
      title: 'Single-Column AST Parse Compliance',
      description: 'Zero table formatting errors or margin parsing corruptions detected by Greenhouse parser.',
      priority: 'High',
    },
    {
      title: 'Quantified STAR Accomplishments',
      description: '8 out of 10 experience bullet statements include measurable business outcomes ($380K cloud savings, 42% latency reduction).',
      priority: 'High',
    },
    {
      title: 'Active Executive Leadership Verbs',
      description: 'Strong usage of active verbs ("Architected", "Spearheaded", "Engineered") with 0% passive voice penalty.',
      priority: 'Medium',
    },
    {
      title: 'Standard Section Hierarchy',
      description: 'Headers conform to Universal Screening Spec (Summary, Experience, Skills, Education).',
      priority: 'Low',
    }
  ],
  improvements: [
    {
      title: 'Missing Critical Distributed Systems Keywords',
      description: 'Target Job Description strongly weights "GraphQL" and "eBPF Profiling", which are missing from your technical skills section.',
      priority: 'High',
    },
    {
      title: 'Recency Weighting on Cloud Microservices',
      description: 'AWS Lambda and Kubernetes deployment metrics should be placed in your current role bullet rather than secondary projects.',
      priority: 'Medium',
    },
    {
      title: 'Contact Metadata Redundancy',
      description: 'Physical mailing address is unneeded and risks geolocation auto-filtering. Keep city/state and GitHub/LinkedIn URLs only.',
      priority: 'Low',
    }
  ],
  keywords: [
    { name: 'TypeScript', weight: 9, matched: true },
    { name: 'React 19', weight: 8, matched: true },
    { name: 'Java / Spring Boot', weight: 10, matched: true },
    { name: 'Kubernetes', weight: 9, matched: true },
    { name: 'Apache Kafka', weight: 8, matched: true },
    { name: 'PostgreSQL', weight: 7, matched: true },
    { name: 'Distributed Systems', weight: 9, matched: true },
    { name: 'Microservices', weight: 8, matched: true },
    { name: 'Docker', weight: 6, matched: true },
    { name: 'CI/CD Pipelines', weight: 7, matched: true },
    { name: 'GraphQL', weight: 9, matched: false },
    { name: 'eBPF Profiling', weight: 8, matched: false },
    { name: 'gRPC', weight: 6, matched: false },
  ],
  skillGaps: [
    { skill: 'Java / Spring Boot', resumeLevel: 95, targetLevel: 90 },
    { skill: 'Distributed Systems & Kafka', resumeLevel: 92, targetLevel: 85 },
    { skill: 'Cloud Orchestration (K8s)', resumeLevel: 85, targetLevel: 80 },
    { skill: 'React & Frontend Architecture', resumeLevel: 90, targetLevel: 75 },
    { skill: 'GraphQL / API Design', resumeLevel: 30, targetLevel: 85 },
  ]
};

/**
 * Initializes the dashboard module.
 */
export function initDashboardModule() {
  // Can be initially rendered with default mock dataset
  renderDashboard(MOCK_ANALYSIS_DATA);
}

/**
 * Main dashboard rendering pipeline: binds data and triggers GSAP animations.
 * @param {Object} data - Analysis results object conforming to MOCK_ANALYSIS_DATA
 */
export function renderDashboard(data = MOCK_ANALYSIS_DATA) {
  // 1. Animate Circular Gauges & Counters
  animateGauges(data.scores);

  // 2. Render Two-Column Strengths & Improvements
  renderFeedbackPillars(data.strengths, data.improvements);

  // 3. Render Interactive Semantic Keyword Cloud
  renderKeywordCloud(data.keywords);

  // 4. Render Horizontal Skill Gap Comparison Bars
  renderSkillGaps(data.skillGaps);
}

/**
 * Animates the 3 circular SVG gauges and numerical counts.
 * @param {Object} scores - { atsScore, matchPercentage, readabilityScore }
 */
function animateGauges(scores) {
  const CIRCLE_CIRCUMFERENCE = 251.2; // 2 * Math.PI * 40

  const gaugeConfigs = [
    { circleId: 'gauge-ats', textId: 'score-ats', target: scores.atsScore },
    { circleId: 'gauge-match', textId: 'score-match', target: scores.matchPercentage },
    { circleId: 'gauge-readability', textId: 'score-readability', target: scores.readabilityScore },
  ];

  gaugeConfigs.forEach(({ circleId, textId, target }) => {
    const circle = document.getElementById(circleId);
    const textEl = document.getElementById(textId);
    if (!circle || !textEl) return;

    // Reset gauge stroke-dashoffset
    circle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE}`;
    circle.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE}`;

    const targetOffset = CIRCLE_CIRCUMFERENCE - (target / 100) * CIRCLE_CIRCUMFERENCE;

    // Animate stroke dashoffset via CSS/GSAP
    setTimeout(() => {
      circle.style.strokeDashoffset = `${targetOffset}`;
    }, 100);

    // Number count-up easing
    const countObj = { value: 0 };
    gsap.to(countObj, {
      value: target,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        textEl.textContent = Math.round(countObj.value);
      }
    });
  });
}

/**
 * Injects Strengths and Improvements cards into the two-column telemetry container.
 */
function renderFeedbackPillars(strengths, improvements) {
  const strengthsContainer = document.getElementById('strengths-container');
  const improvementsContainer = document.getElementById('improvements-container');

  if (strengthsContainer) {
    strengthsContainer.innerHTML = strengths.map((item) => `
      <div class="p-4 rounded-xl bg-surface/80 border border-border-subtle hover:border-accent-mint/40 transition-all flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h5 class="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span class="text-accent-mint">✓</span> ${item.title}
          </h5>
          <p class="text-[11px] text-slate-400 font-sans leading-relaxed">${item.description}</p>
        </div>
        <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
          item.priority === 'High' ? 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30' : 'bg-white/5 text-slate-400'
        }">
          ${item.priority}
        </span>
      </div>
    `).join('');
  }

  if (improvementsContainer) {
    improvementsContainer.innerHTML = improvements.map((item) => `
      <div class="p-4 rounded-xl bg-surface/80 border border-border-subtle hover:border-amber-400/40 transition-all flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h5 class="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span class="text-amber-400">⚠</span> ${item.title}
          </h5>
          <p class="text-[11px] text-slate-400 font-sans leading-relaxed">${item.description}</p>
        </div>
        <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
          item.priority === 'High' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-slate-400'
        }">
          ${item.priority}
        </span>
      </div>
    `).join('');
  }
}

/**
 * Injects weighted keywords with interactive scaling and brightness.
 */
function renderKeywordCloud(keywords) {
  const container = document.getElementById('keyword-cloud-container');
  if (!container) return;

  container.innerHTML = keywords.map((k) => {
    // Determine visual weight styling based on relevance rating (1 to 10)
    const isMatched = k.matched;
    const sizeClass = k.weight >= 9 ? 'text-xs font-bold' : 'text-[11px] font-medium';
    const colorClass = isMatched
      ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30 hover:bg-accent-cyan/20'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20';

    return `
      <span class="px-3 py-1.5 rounded-xl border font-mono tracking-tight transition-all transform hover:scale-105 cursor-pointer flex items-center gap-1.5 ${sizeClass} ${colorClass}" title="Weight: ${k.weight}/10">
        <span>${isMatched ? '✓' : '+'}</span>
        <span>${k.name}</span>
      </span>
    `;
  }).join('');
}

/**
 * Injects horizontal Skill Gap comparison bars and animates their widths.
 */
function renderSkillGaps(skillGaps) {
  const container = document.getElementById('skill-gap-container');
  if (!container) return;

  container.innerHTML = skillGaps.map((sg) => `
    <div class="space-y-1.5">
      <div class="flex justify-between text-xs font-mono">
        <span class="text-slate-300 font-medium">${sg.skill}</span>
        <div class="flex items-center gap-3 text-[10px]">
          <span class="text-accent-cyan">Resume: ${sg.resumeLevel}%</span>
          <span class="text-slate-500">|</span>
          <span class="text-slate-400">Target: ${sg.targetLevel}%</span>
        </div>
      </div>
      <div class="w-full h-2 rounded-full bg-surface border border-border-subtle overflow-hidden flex relative">
        <!-- Target Marker Line -->
        <div class="absolute top-0 bottom-0 w-[2px] bg-white z-10" style="left: ${sg.targetLevel}%" title="Target Benchmark"></div>
        <!-- Animated Resume Fill Bar -->
        <div class="h-full rounded-full transition-all duration-1000 ${
          sg.resumeLevel >= sg.targetLevel
            ? 'bg-gradient-to-r from-accent-cyan to-accent-mint'
            : 'bg-gradient-to-r from-amber-400 to-rose-400'
        }" style="width: 0%" data-target-width="${sg.resumeLevel}%"></div>
      </div>
    </div>
  `).join('');

  // Animate the bar widths via GSAP
  setTimeout(() => {
    const bars = container.querySelectorAll('[data-target-width]');
    bars.forEach((bar) => {
      bar.style.width = bar.getAttribute('data-target-width');
    });
  }, 150);
}
