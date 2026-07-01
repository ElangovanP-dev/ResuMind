import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

// Wake up the Render backend immediately when the site loads
api.get('/api/auth/ping').catch(() => {})

/* ───── Scroll-reveal hook ───── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return ref
}

/* ───── Animated Counter ───── */
function Counter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
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
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ───── FAQ Item ───── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item bg-white/80 backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
      >
        <span className="pr-4">{q}</span>
        <svg className={`faq-chevron w-5 h-5 flex-shrink-0 text-slate-400 ${open ? 'open' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`faq-answer text-slate-600 text-sm leading-relaxed ${open ? 'open' : ''}`}>
        {a}
      </div>
    </div>
  )
}

/* ───── Section Header ───── */
function SectionHeader({ badge, title, subtitle }) {
  const ref = useReveal()
  return (
    <div ref={ref} className="reveal-on-scroll text-center max-w-2xl mx-auto mb-16">
      {badge && (
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1))', color: '#6366f1' }}>
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{title}</h2>
      {subtitle && <p className="text-slate-600 text-lg">{subtitle}</p>}
    </div>
  )
}

/* ───── Hero Score Mockup ───── */
function HeroMockup() {
  const circumference = 2 * Math.PI * 40
  const score = 92
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="hero-mockup relative">
      <div className="gradient-border rounded-2xl shadow-2xl" style={{ background: 'rgba(255,255,255,0.95)' }}>
        <div className="shimmer-overlay rounded-2xl" />
        <div className="p-6 md:p-8 relative z-[1]" style={{ minWidth: 280 }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold gradient-text">ResuMind</span>
          </div>

          {/* Score gauge */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative pulse-glow rounded-full">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                <circle cx="48" cy="48" r="40" stroke="url(#scoreGrad)" strokeWidth="6" fill="none"
                  strokeLinecap="round" strokeDasharray={circumference}
                  className="score-ring-animated"
                  style={{ '--target-offset': offset }} />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-900">{score}</span>
                <span className="text-[10px] text-slate-500 font-medium">/100</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Resume Score</p>
              <p className="text-sm font-bold text-emerald-600">Excellent</p>
            </div>
          </div>

          {/* Mini checks */}
          <div className="space-y-2.5">
            {[
              { label: 'ATS Parse Rate', value: 98, color: '#10b981' },
              { label: 'Skills Match', value: 85, color: '#6366f1' },
              { label: 'Content Quality', value: 91, color: '#3b82f6' },
              { label: 'Formatting', value: 95, color: '#8b5cf6' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-28 truncate">{item.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${item.value}%`, background: item.color }} />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ LANDING PAGE ═══════════════════════ */
export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* refs for flip-in cards */
  const howRef1 = useRef(null)
  const howRef2 = useRef(null)
  const howRef3 = useRef(null)

  useEffect(() => {
    const refs = [howRef1, howRef2, howRef3]
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target) } })
    }, { threshold: 0.2 })
    refs.forEach(r => { if (r.current) obs.observe(r.current) })
    return () => obs.disconnect()
  }, [])

  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: 'ATS Compatibility',
      desc: 'Deep analysis against reverse-engineered ATS platforms like Greenhouse, Lever & Workday.',
      color: '#10b981'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'AI-Powered Insights',
      desc: 'Gemini AI analyzes your resume content, writing quality, and quantifiable impact.',
      color: '#6366f1'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      title: 'JD Tailoring',
      desc: 'Paste any job description and get precise skill-match analysis with keyword suggestions.',
      color: '#3b82f6'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Score & Benchmarks',
      desc: 'Get a 0-100 ATS score with category breakdowns: formatting, skills, content & impact.',
      color: '#8b5cf6'
    }
  ]

  const faqs = [
    { q: 'What is an ATS resume score?', a: 'An ATS (Applicant Tracking System) score measures how well your resume\'s format, keywords, and content align with what automated screening software looks for. A higher score means your resume is more likely to pass through ATS filters and reach a human recruiter.' },
    { q: 'How does ResuMind analyze my resume?', a: 'ResuMind uses Google\'s Gemini AI to deeply analyze your resume\'s content, structure, and formatting. It checks for ATS compatibility, quantifiable achievements, keyword matching, writing quality, and provides actionable improvement suggestions.' },
    { q: 'What is JD Tailoring?', a: 'JD (Job Description) Tailoring lets you paste any job posting, and ResuMind will compare your resume against it. It identifies matching skills, missing keywords, and suggests specific changes to tailor your resume for that particular role.' },
    { q: 'Is my resume data secure?', a: 'Yes. Your resume data is processed securely and is only accessible to your account. We do not share your data with third parties or use it for training purposes.' },
    { q: 'What file formats are supported?', a: 'ResuMind currently supports PDF resume uploads up to 5MB in size. PDF is the most universally accepted format by ATS platforms and recruiters.' },
    { q: 'Is ResuMind free to use?', a: 'Yes! ResuMind is completely free to use. Create an account, upload your resume, and get instant AI-powered analysis with detailed feedback and improvement tips.' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ━━━ NAVBAR ━━━ */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold gradient-text">ResuMind</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register"
              className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="landing-section pt-32 md:pt-40 pb-20 relative">
        <div className="parallax-blob parallax-blob-1" style={{ top: '-10%', left: '-8%' }} />
        <div className="parallax-blob parallax-blob-2" style={{ bottom: '5%', right: '-5%' }} />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-[1]">
          {/* Left — Text */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1))', color: '#6366f1' }}>
              AI Resume Analyzer
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Is your resume<br />
              <span className="gradient-text">good enough?</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              A free AI-powered resume checker that analyzes ATS compatibility, content quality, and skills — giving you actionable tips to land more interviews.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/register"
                className="btn-primary px-8 py-4 text-lg font-bold rounded-2xl inline-flex items-center gap-2 shadow-xl">
                <span>✨</span> Get Your Score — Free
              </Link>
              <a href="#how-it-works" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1">
                See how it works
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right — 3D Mockup */}
          <div className="flex-1 flex justify-center perspective-container">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ━━━ STATS ━━━ */}
      <section className="py-12 border-y border-slate-200/60 bg-white/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-4">
          {[
            { value: 10000, suffix: '+', label: 'Resumes Analyzed' },
            { value: 27, suffix: '', label: 'Crucial Checks' },
            { value: 95, suffix: '%', label: 'Accuracy Rate' },
            { value: 4.8, suffix: '★', label: 'User Rating' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-extrabold gradient-text mb-1">
                <Counter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section id="how-it-works" className="landing-section">
        <SectionHeader
          badge="How It Works"
          title="Three simple steps to a better resume"
          subtitle="Upload, analyze, and improve — it takes less than 60 seconds."
        />

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 perspective-container">
          {[
            {
              ref: howRef1,
              step: '01',
              title: 'Upload Your Resume',
              desc: 'Drop your PDF resume into our secure uploader. We support files up to 5MB.',
              icon: (
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              ),
              stagger: 'stagger-1'
            },
            {
              ref: howRef2,
              step: '02',
              title: 'AI Analyzes Everything',
              desc: 'Gemini AI scans your content for ATS compatibility, skills, formatting, and impact.',
              icon: (
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              stagger: 'stagger-2'
            },
            {
              ref: howRef3,
              step: '03',
              title: 'Get Actionable Results',
              desc: 'Receive your ATS score, category breakdowns, and specific tips to improve each section.',
              icon: (
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              stagger: 'stagger-3'
            }
          ].map((item) => (
            <div key={item.step} ref={item.ref}
              className={`flip-in ${item.stagger} glass-card p-8 text-center relative group`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
                STEP {item.step}
              </div>
              <div className="w-16 h-16 mx-auto mb-5 mt-3 rounded-2xl bg-slate-50 flex items-center justify-center
                              group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="landing-section bg-gradient-to-b from-white/0 to-indigo-50/30">
        <SectionHeader
          badge="Features"
          title="Everything you need to land interviews"
          subtitle="Our AI checks your resume across multiple dimensions that matter to ATS systems and recruiters."
        />

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 perspective-container">
          {features.map((feat, i) => {
            const ref = useReveal()
            return (
              <div key={feat.title} ref={ref}
                className={`reveal-on-scroll stagger-${i + 1} card-3d glass-card p-7 flex gap-5 items-start`}>
                <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: `${feat.color}15`, color: feat.color }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{feat.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ━━━ TWO-TIER SYSTEM ━━━ */}
      <section className="landing-section relative">
        <div className="parallax-blob parallax-blob-2" style={{ top: '10%', left: '-10%' }} />
        <SectionHeader
          badge="How Scoring Works"
          title="A two-tier scoring system"
          subtitle="ResuMind evaluates your resume from both the machine and human perspective."
        />

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            {
              num: '1',
              title: 'ATS Parse Rate',
              desc: 'Like an ATS, we analyze and interpret your resume\'s content and structure. We check against signals from hundreds of ATS platforms including Greenhouse, Lever, and Workday. If we can understand your skills, experience, and sections — so can the ATS.',
              gradient: 'linear-gradient(135deg, #10b981, #059669)',
            },
            {
              num: '2',
              title: 'Content Quality',
              desc: 'Recruiters look beyond what ATS checks. We evaluate your quantifiable achievements, writing clarity, and impact statements. The AI identifies ambiguous claims, missing context, and suggests improvements to make your resume stand out to human reviewers.',
              gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            }
          ].map((tier) => {
            const ref = useReveal()
            return (
              <div key={tier.num} ref={ref} className="reveal-on-scroll glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] opacity-10"
                  style={{ background: tier.gradient }} />
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white font-extrabold text-xl"
                  style={{ background: tier.gradient }}>
                  {tier.num}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{tier.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{tier.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ━━━ FAQ ━━━ */}
      <section id="faq" className="landing-section bg-gradient-to-b from-indigo-50/20 to-white/0">
        <SectionHeader
          badge="FAQ"
          title="Frequently asked questions"
          subtitle="Everything you need to know about ResuMind."
        />

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="landing-section relative overflow-hidden">
        <div className="absolute inset-0 z-0"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #10b981 100%)' }} />
        <div className="parallax-blob" style={{ width: 400, height: 400, top: '-20%', right: '-10%', background: 'rgba(255,255,255,0.1)', filter: 'blur(60px)', opacity: 0.3 }} />

        <div className="max-w-3xl mx-auto text-center relative z-[1]">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Get your resume score now!
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Upload your resume and receive an AI-powered analysis with actionable tips to improve your chances of landing interviews.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-lg font-bold transition-all hover:-translate-y-1 hover:shadow-2xl"
            style={{ background: 'white', color: '#6366f1' }}>
            <span>🚀</span> Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-extrabold text-white">ResuMind</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                AI-powered resume analyzer that helps you craft the perfect resume, pass ATS screening, and land more interviews.
              </p>
            </div>
            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-xs">
            <p>© {new Date().getFullYear()} ResuMind. Made with ❤️ for job seekers everywhere.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
