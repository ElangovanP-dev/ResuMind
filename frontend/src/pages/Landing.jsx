import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import IsometricResumeVisual from '../components/IsometricResumeVisual'
import BentoResultsDashboard from '../components/BentoResultsDashboard'
import DynamicShowcaseSlider from '../components/DynamicShowcaseSlider'
import api from '../services/api'

// Wake up backend service on load
api.get('/api/auth/ping').catch(() => {})

/* ───── Animated Counter Hook / Component ───── */
function Counter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ───── Section Header Component ───── */
function SectionHeader({ badge, title, subtitle }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-14 px-4">
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  )
}

/* ───── Interactive FAQ Accordion Item ───── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#111318]/70 backdrop-blur-md transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-bold text-base text-white">{q}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/10 text-slate-300 transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-180 text-cyan-400' : ''}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [modalFile, setModalFile] = useState(null)
  const [modalError, setModalError] = useState('')

  const handleQuickUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setModalError('Only PDF files are supported.')
      return
    }
    setModalFile(file)
    setModalError('')
    // Direct user straight to upload workflow
    navigate('/upload')
  }

  const coreFeatures = [
    {
      title: 'ATS Parsing Simulator',
      tag: 'AST Syntax Verification',
      desc: 'Simulate how Workday, Greenhouse, and Lever parse headers, date formats, and job roles. Catches invisible text-stripping bugs before recruiters ever see them.',
      icon: (
        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      stat: '99.8% Parse Accuracy',
      accentColor: '#6366F1'
    },
    {
      title: 'Multi-Axis Skills Radar',
      tag: 'Semantic Taxonomy',
      desc: 'Maps your technical competencies against contemporary market requirements. Highlights matched capabilities and identifies high-value vacancy gaps.',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      stat: '500+ Skills Modeled',
      accentColor: '#10B981'
    },
    {
      title: 'Unconscious Bias Detector',
      tag: 'Neutrality Screening',
      desc: 'Detects demographic indicators, unintentional gender-biased language, and graduation chronology markers to safeguard candidate fairness.',
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      stat: 'Zero Bias Compliance',
      accentColor: '#06B6D4'
    },
    {
      title: 'Resume DNA & Metric Density',
      tag: 'STAR Architecture',
      desc: 'Quantifies impact density across every sentence. Identifies passive voice constructs and offers 1-click senior executive active verb upgrades.',
      icon: (
        <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      stat: '8.4x Interview Multiplier',
      accentColor: '#8B5CF6'
    }
  ]

  const faqList = [
    {
      q: 'How does Resume Mind differ from generic resume checkers?',
      a: 'Most tools rely on naive keyword counts that encourage keyword stuffing. Resume Mind uses a 5-pillar orthogonal scoring engine (ATS Parseability, Hard Skills, Impact, Structure, Clarity) powered by deep AST extraction and dual Gemini neural models, ensuring zero redundant feedback.'
    },
    {
      q: 'Will my resume be shared or used to train public AI models?',
      a: 'Never. Your data remains strictly confidential and encrypted in transit and at rest. We never sell your resume or use your private work history for external model training.'
    },
    {
      q: 'Which Applicant Tracking Systems (ATS) are benchmarked?',
      a: 'We calibrate our parsers against the most widely used enterprise recruitment systems including Greenhouse, Lever, Workday, SmartRecruiters, Taleo, and iCIMS.'
    },
    {
      q: 'Is Resume Mind completely free?',
      a: 'Yes! Instant resume scoring, the 5-pillar breakdown, ATS simulator, and STAR bullet point improvements are 100% free for all job seekers.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 overflow-x-hidden pt-20">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HERO SECTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">

          {/* Left Column: Value Proposition & High-Impact Copy */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold">
              <span className="live-pulse" />
              <span>NEXT-GEN NEURAL ATS PARSER</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Beat the ATS.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                Land the Interview.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              An elite resume analysis platform engineered for tech professionals. Benchmark your resume against enterprise screening algorithms with our non-redundant 5-pillar evaluation engine.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/upload"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border border-indigo-400/30 flex items-center justify-center gap-2"
              >
                <span>✨</span> Analyze My Resume Free
              </Link>
              <a
                href="#demo-dashboard"
                className="w-full sm:w-auto px-6 py-4 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center gap-2"
              >
                Explore Bento Dashboard
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {/* Social Proof Metric Badges */}
            <div className="pt-8 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <p className="text-2xl font-black text-white">
                  <Counter target={50000} suffix="+" />
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Resumes Analyzed</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-black text-emerald-400">
                  <Counter target={98} suffix=".4%" />
                </p>
                <p className="text-xs text-slate-400 mt-0.5">ATS Parse Accuracy</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-black text-cyan-400">
                  <Counter target={5} suffix=" Pillars" />
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Zero Redundancy</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-black text-indigo-400">
                  <Counter target={8} suffix=".4x" />
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Interview Multiplier</p>
              </div>
            </div>
          </div>

          {/* Right Column: Isometric 3D Exploded Tech Resume Visual */}
          <div className="lg:col-span-5 flex justify-center perspective-1200">
            <IsometricResumeVisual />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. INTERACTIVE BENTO RESULTS DASHBOARD SECTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="demo-dashboard" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] relative bg-[#0D0E13]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Live Interactive Architecture"
            title="Bento Grid Results Dashboard"
            subtitle="Explore how Resume Mind dissects every resume into orthogonal data points: circular benchmarks, category micro-bars, interactive skill badges, and prioritized fixes."
          />

          <div className="relative">
            <BentoResultsDashboard interactive={true} />
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all transform hover:-translate-y-0.5"
            >
              Scan Your Real Resume in 30 Seconds →
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. DYNAMIC BEFORE & AFTER TRANSFORMATION SHOWCASE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] relative">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            badge="STAR Transformation"
            title="Watch Weak Bullets Become High-Impact Accomplishments"
            subtitle="Swipe or use keyboard arrows to inspect how vague responsibilities are re-engineered into quantified STAR metrics with senior executive active verbs."
          />

          <DynamicShowcaseSlider />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. CORE FEATURE SHOWCASE (BENTO GRID)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-[#0D0E13]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Enterprise Capabilities"
            title="Engineered for the Modern Tech Job Market"
            subtitle="Designed from the ground up to solve the real obstacles between great engineers and hiring manager interviews."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feat) => (
              <div
                key={feat.title}
                className="bento-card p-6 flex flex-col justify-between group"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `${feat.accentColor}15`,
                      borderColor: `${feat.accentColor}35`,
                    }}
                  >
                    {feat.icon}
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    {feat.tag}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold" style={{ color: feat.accentColor }}>
                    {feat.stat}
                  </span>
                  <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. 5 ORTHOGONAL ANALYSIS PILLARS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Scoring Methodology"
            title="5 Orthogonal Analysis Pillars"
            subtitle="Each pillar evaluates an independent dimension with calibrated weights to ensure non-redundant and mathematically sound scoring."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              {
                num: '01',
                name: 'ATS Parseability',
                weight: '20% Weight',
                color: '#6366F1',
                desc: 'Single-column structure, clean typography, and contact metadata parsing without parser faults.'
              },
              {
                num: '02',
                name: 'Hard Skills',
                weight: '30% Weight',
                color: '#10B981',
                desc: 'Semantic and exact matching against job requirements without artificial keyword repetition.'
              },
              {
                num: '03',
                name: 'Impact & Metrics',
                weight: '25% Weight',
                color: '#06B6D4',
                desc: 'Quantified accomplishments (%, $, throughput) leveraging the STAR methodology.'
              },
              {
                num: '04',
                name: 'Structural Balance',
                weight: '15% Weight',
                color: '#8B5CF6',
                desc: 'Optimal bullet density (3–5 per role), chronological consistency, and visual white space.'
              },
              {
                num: '05',
                name: 'Clarity & Tone',
                weight: '10% Weight',
                color: '#F59E0B',
                desc: 'Flags passive voice and filler phrasing, providing 1-click active verb upgrades.'
              }
            ].map((pillar) => (
              <div
                key={pillar.num}
                className="bento-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono" style={{ color: pillar.color }}>
                      {pillar.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">
                      {pillar.weight}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{pillar.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. FREQUENTLY ASKED QUESTIONS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-[#0D0E13]">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            badge="Clarity & Trust"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about our analysis engine and privacy guarantees."
          />

          <div className="space-y-4">
            {faqList.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          7. BOTTOM CALL TO ACTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] relative overflow-hidden text-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/20">
            100% FREE · NO CREDIT CARD REQUIRED
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stop Guessing. Start Landing Tech Interviews.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload your PDF resume now to inspect invisible parser faults, benchmark your hard skills, and receive prioritized fixes.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/upload"
              className="w-full sm:w-auto px-9 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              Analyze My Resume Now
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          8. FOOTER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-white/[0.08] py-12 px-4 sm:px-6 lg:px-8 bg-[#07080A] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
              RM
            </div>
            <span className="font-bold text-slate-300 text-sm">Resume Mind</span>
            <span className="text-slate-600">· Next-Gen ATS Resume Architecture</span>
          </div>

          <p>© {new Date().getFullYear()} Resume Mind. All rights reserved. Zero vendor affiliation with Greenhouse, Lever, or Workday.</p>

          <div className="flex items-center gap-5 text-slate-400">
            <Link to="/upload" className="hover:text-white transition-colors">Scan</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
