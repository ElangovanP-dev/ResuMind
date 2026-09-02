import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function TrendingATSScanner() {
  const [activeTab, setActiveTab] = useState('scanner') // 'scanner', 'star', 'pillars', 'ast'
  const [isScanning, setIsScanning] = useState(true)
  const [scanProgress, setScanProgress] = useState(88)
  const [targetRole, setTargetRole] = useState('Full-Stack Tech Lead')

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((prev) => (prev >= 100 ? 70 : prev + 1))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const detectedSkills = [
    { name: 'React 19', match: true, category: 'Frontend' },
    { name: 'TypeScript', match: true, category: 'Languages' },
    { name: 'Java / Spring Boot', match: true, category: 'Backend' },
    { name: 'PostgreSQL', match: true, category: 'Database' },
    { name: 'Kubernetes', match: true, category: 'Cloud' },
    { name: 'AWS Lambda', match: true, category: 'Cloud' },
    { name: 'Kafka', match: true, category: 'Distributed' },
    { name: 'GraphQL', match: false, category: 'Missing Gap' },
  ]

  return (
    <div className="w-full relative select-none rounded-3xl overflow-hidden border border-white/[0.1] bg-[#0A0D15]/90 backdrop-blur-2xl shadow-2xl shadow-indigo-950/40">

      {/* ── TOP TERMINAL HUD HEADER ── */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0E121E]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* macOS Style Traffic Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block border border-rose-400/40" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block border border-amber-400/40" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block border border-emerald-400/40" />
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-2">
              ATS NEURAL PARSER CORE
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              GREENHOUSE & LEVER COMPLIANT
            </span>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-[#141824]/90 p-1 rounded-xl border border-white/10">
          {[
            { id: 'scanner', label: 'Laser ATS Scan' },
            { id: 'star', label: 'STAR Bullets' },
            { id: 'pillars', label: '5-Pillars' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TERMINAL BODY (TWO COLUMN LAYOUT) ── */}
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* ── LEFT COLUMN: INTERACTIVE RESUME DOCUMENT WITH LASER SCANLINE ── */}
        <div className="lg:col-span-7 relative">
          <div className="relative rounded-2xl p-6 sm:p-7 bg-[#0C0F17]/95 border border-white/[0.12] shadow-2xl overflow-hidden font-mono text-xs">

            {/* Glowing Laser Scanline */}
            {isScanning && <div className="laser-scanline" />}

            {/* Resume Header Simulation */}
            <div className="border-b border-white/[0.08] pb-4 mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-sans tracking-tight">
                  ALEX CHEN, M.S.
                </h3>
                <p className="text-cyan-400 text-xs mt-0.5">
                  Senior Full-Stack & Distributed Systems Architect
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  San Francisco, CA · github.com/alexchen · linkedin.com/in/alexchen
                </p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ✓ SINGLE COLUMN ATS PASS
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                // EXECUTIVE SUMMARY
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
                Full-Stack Systems Engineer with 8+ years scaling cloud architectures from seed to IPO. Specializing in high-throughput React & Spring Boot microservices serving 40M+ monthly active users.
              </p>
            </div>

            {/* Work Experience Section with Highlighted Active Verbs & STAR Metrics */}
            <div className="space-y-3 mb-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                // PROFESSIONAL EXPERIENCE
              </span>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex justify-between text-slate-300 font-bold text-[11px] mb-1 font-sans">
                  <span>Lead Platform Engineer @ CloudScale Technologies</span>
                  <span className="text-slate-400">2022 — Present</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans">
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">▸</span>
                    <span>
                      <strong className="text-cyan-300 font-semibold">Architected and deployed</strong> distributed Kafka event pipelines processing <strong className="text-emerald-300 font-semibold">45,000 req/sec</strong>, decreasing end-to-end p99 latency by <strong className="text-emerald-300 font-semibold">42%</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">▸</span>
                    <span>
                      <strong className="text-cyan-300 font-semibold">Spearheaded migration</strong> of legacy monolithic backend to containerized Kubernetes pods, driving <strong className="text-emerald-300 font-semibold">$380,000 annual cloud savings</strong>.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Detected Skills Chips */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                // SEMANTICALLY DETECTED HARD SKILLS (MATCHED TO JD)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detectedSkills.map((skill) => (
                  <span
                    key={skill.name}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      skill.match
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {skill.match ? '✓ ' : '+ '}
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Terminal Action Bar */}
            <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScanning(!isScanning)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white font-sans text-xs flex items-center gap-1 transition-colors"
                >
                  {isScanning ? '⏸ Pause Laser' : '▶ Resume Laser'}
                </button>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Scan Speed: 120 tokens/sec
                </span>
              </div>
              <span className="text-emerald-400 font-bold">
                0 Syntax Parse Errors
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: TELEMETRY SCORECARD & VALUE LIFT ── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Primary Score KPI Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#121624] to-[#0D1019] border border-white/[0.12] shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                  CANDIDATE BENCHMARK
                </span>
                <h4 className="text-lg font-black text-white">ATS Match Index</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                TOP 2% TIER
              </span>
            </div>

            {/* Big Circular Metric */}
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    stroke="url(#scannerGrad)"
                    strokeWidth="8"
                    strokeDasharray="264"
                    strokeDashoffset="10"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <defs>
                    <linearGradient id="scannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="50%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">96</span>
                  <span className="text-[9px] font-mono text-slate-400">/100</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Greenhouse Match: 98%
                </p>
                <p className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Lever Compatibility: 96%
                </p>
                <p className="text-slate-400 text-[11px]">
                  Estimated Interview Probability: <strong className="text-cyan-300">8.4x Average</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 5-Pillar Micro Bars */}
          <div className="p-5 rounded-2xl bg-[#0E121E]/80 border border-white/[0.08] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
              5 ORTHOGONAL ANALYSIS PILLARS
            </span>

            {[
              { name: 'Hard Skills Alignment (30%)', score: 98, color: 'from-cyan-500 to-indigo-500' },
              { name: 'STAR Metric Density (25%)', score: 94, color: 'from-indigo-500 to-violet-500' },
              { name: 'ATS Layout Integrity (20%)', score: 100, color: 'from-emerald-500 to-teal-500' },
              { name: 'Structure & Sections (15%)', score: 95, color: 'from-cyan-400 to-emerald-400' },
              { name: 'Executive Clarity (10%)', score: 92, color: 'from-amber-400 to-rose-400' },
            ].map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{p.name}</span>
                  <span className="text-white font-mono font-bold">{p.score}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${p.color}`}
                    style={{ width: `${p.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Direct Action CTA */}
          <div className="pt-2">
            <Link
              to="/upload"
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-center flex items-center justify-center gap-2 glow-btn-primary"
            >
              <span>🚀</span> Scan Your Real Resume Now (Free) →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
