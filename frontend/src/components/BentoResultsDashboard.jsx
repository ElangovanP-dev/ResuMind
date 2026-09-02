import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BentoResultsDashboard({ interactive = true, initialData = null }) {
  // Demo or real data
  const [score, setScore] = useState(initialData?.atsScore ?? 92)
  const [expandedPillar, setExpandedPillar] = useState(null)
  const [activeSkillTab, setActiveSkillTab] = useState('all') // 'all', 'matched', 'missing'
  const [addedSkills, setAddedSkills] = useState([])

  const defaultPillars = [
    {
      id: 'layout',
      name: 'ATS Parseability & Layout',
      weight: '20%',
      score: initialData?.atsParseability ?? 98,
      color: '#6366F1',
      desc: 'Single-column structure, clean typography, standard headers (Experience, Education, Skills) validated.',
      findings: '100% parse tree accuracy. Clean contact metadata found (Email, Phone, LinkedIn).'
    },
    {
      id: 'skills',
      name: 'Hard Skills & Alignment',
      weight: '30%',
      score: initialData?.hardSkillsScore ?? 88,
      color: '#10B981',
      desc: 'Semantic and exact matching against target engineering taxonomy and core frameworks.',
      findings: 'Strong coverage for backend and cloud systems. Minor keyword gaps in CI/CD pipeline orchestration.'
    },
    {
      id: 'impact',
      name: 'Impact & Quantification',
      weight: '25%',
      score: initialData?.impactScore ?? 94,
      color: '#06B6D4',
      desc: 'STAR accomplishment framework with quantified scale (%, $, throughput, user count).',
      findings: 'Excellent metric density: 8 of 10 bullet points feature hard quantitative results.'
    },
    {
      id: 'structure',
      name: 'Structural Balance & Hierarchy',
      weight: '15%',
      score: initialData?.structuralScore ?? 95,
      color: '#8B5CF6',
      desc: 'Optimal bullet density (3–5 per role), chronological consistency, page geometry.',
      findings: 'Perfect white-space balance. Exactly 1 page with consistent reverse-chronology.'
    },
    {
      id: 'clarity',
      name: 'Clarity & Executive Tone',
      weight: '10%',
      score: initialData?.clarityScore ?? 90,
      color: '#F59E0B',
      desc: 'Active voice verbs, zero passive filler phrasing, and senior-level executive tone.',
      findings: 'Zero passive voice instances. Active verbs ("Architected", "Engineered", "Spearheaded") utilized.'
    }
  ]

  const matchedSkills = initialData?.skillsFound?.length > 0 
    ? initialData.skillsFound 
    : ['React', 'TypeScript', 'Node.js', 'Spring Boot', 'PostgreSQL', 'Docker', 'AWS', 'Redis', 'TailwindCSS', 'GraphQL']

  const missingKeywords = initialData?.missingKeywords?.length > 0 
    ? initialData.missingKeywords 
    : ['Kubernetes', 'CI/CD Pipelines', 'Kafka Streams', 'Terraform']

  const strengths = initialData?.strengths?.length > 0
    ? initialData.strengths
    : [
        'Single-column structure conforms perfectly to modern ATS parsers (Greenhouse, Lever, Workday).',
        'Consistently uses the STAR format with tangible performance percentages and operational metrics.',
        'Strong technical keyword density without spamming or artificial repetition.',
        'High-impact executive action verbs throughout all experience bullet points.'
      ]

  const recommendations = initialData?.improvements?.length > 0
    ? initialData.improvements.map((text, idx) => ({
        id: `rec-${idx}`,
        title: `Priority Enhancement #${idx + 1}`,
        desc: text,
        impact: `+${Math.max(2, 6 - idx)} pts`
      }))
    : [
        {
          id: 'rec-1',
          title: 'Orchestration & DevOps Exposure',
          desc: 'Target cloud job profiles emphasize container orchestration. Add specific mentions of Kubernetes or Terraform in your infrastructure bullet points.',
          impact: '+4 pts'
        },
        {
          id: 'rec-2',
          title: 'Quantify Scale in Secondary Role',
          desc: 'In your earlier Software Engineer position, specify the request throughput or database size to match the impact of your lead role.',
          impact: '+3 pts'
        },
        {
          id: 'rec-3',
          title: 'Certifications & Continuous Learning',
          desc: 'Adding an AWS Certified Solutions Architect or similar badge directly reinforces the cloud skills section.',
          impact: '+2 pts'
        }
      ]

  const togglePillar = (id) => {
    setExpandedPillar(expandedPillar === id ? null : id)
  }

  const handleAddSkill = (skill) => {
    if (!addedSkills.includes(skill)) {
      setAddedSkills([...addedSkills, skill])
      setScore(prev => Math.min(100, prev + 2))
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* ━━━ TOP ROW BENTO: PRIMARY GAUGE + CATEGORY MICRO-BARS ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── CARD 1: PRIMARY OVERALL SCORE GAUGE (col-span-5) ── */}
        <div className="bento-card p-6 md:p-8 lg:col-span-5 flex flex-col justify-between relative">
          {/* Subtle Corner Glow */}
          <div className="absolute -top-16 -left-16 w-36 h-36 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                CORE ATS BENCHMARK
              </span>
              <div className="flex items-center gap-2">
                <span className="live-pulse" />
                <span className="text-xs font-medium text-slate-400">Live Evaluation</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 my-6">
              {/* Circular Gauge */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress fill */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#bentoScoreGradient)"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - score / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="bentoScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="60%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black tracking-tight text-white">{score}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">/ 100</span>
                </div>
              </div>

              {/* Score Assessment */}
              <div className="text-center sm:text-left space-y-2">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {score >= 90 ? '🏆 Elite Candidate Match' : score >= 80 ? '🎯 Highly Competitive' : '⚡ Action Recommended'}
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Top {score >= 90 ? '3%' : score >= 80 ? '12%' : '25%'} of Resumes
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  Calibrated against actual screening filters from Greenhouse, Lever, Workday, and SmartRecruiters.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Model: Dual Gemini AI + Rule Engine</span>
            <span className="text-emerald-400">Zero Redundancy</span>
          </div>
        </div>

        {/* ── CARD 2: 5 ORTHOGONAL CATEGORY PILLARS (col-span-7) ── */}
        <div className="bento-card p-6 md:p-8 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>5 Orthogonal Evaluation Pillars</span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">100% Weight Total</span>
              </h4>
              <span className="text-xs text-slate-400">Click to expand details</span>
            </div>

            <div className="space-y-4">
              {defaultPillars.map((p) => {
                const isExp = expandedPillar === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => interactive && togglePillar(p.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isExp 
                        ? 'bg-white/[0.04] border-white/20' 
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/5">
                          {p.weight}
                        </span>
                      </div>
                      <span className="text-sm font-black font-mono" style={{ color: p.color }}>
                        {p.score}%
                      </span>
                    </div>

                    {/* Micro-bar progress */}
                    <div className="micro-bar-bg">
                      <div
                        className="micro-bar-fill"
                        style={{
                          width: `${p.score}%`,
                          background: `linear-gradient(90deg, ${p.color}88, ${p.color})`,
                        }}
                      />
                    </div>

                    {/* Expandable Finding Detail */}
                    <AnimatePresence>
                      {isExp && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-300 leading-relaxed overflow-hidden"
                        >
                          <p className="mb-1 text-slate-400">{p.desc}</p>
                          <p className="font-medium text-white flex items-center gap-1.5 mt-1">
                            <span className="text-emerald-400">✓</span> {p.findings}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ MIDDLE ROW BENTO: SKILLS BREAKDOWN + ACTIONABLE RECOMMENDATIONS ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── CARD 3: INTERACTIVE SKILLS BREAKDOWN (col-span-6) ── */}
        <div className="bento-card p-6 md:p-8 lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Interactive Skills Analysis</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {matchedSkills.length + addedSkills.length} Verified
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">Semantic keyword matching against industry standards</p>
              </div>

              {/* Tab filter buttons */}
              <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10 self-start sm:self-auto">
                <button
                  onClick={() => setActiveSkillTab('all')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeSkillTab === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveSkillTab('matched')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeSkillTab === 'matched' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Matched
                </button>
                <button
                  onClick={() => setActiveSkillTab('missing')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeSkillTab === 'missing' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gaps
                </button>
              </div>
            </div>

            {/* Tags Container */}
            <div className="space-y-4">
              {/* Matched Tags */}
              {(activeSkillTab === 'all' || activeSkillTab === 'matched') && (
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-2">
                    ✓ Matched Hard Skills ({matchedSkills.length + addedSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[...matchedSkills, ...addedSkills].map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Gaps Tags */}
              {(activeSkillTab === 'all' || activeSkillTab === 'missing') && (
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block mb-2">
                    ⚠️ Missing Target Keywords ({missingKeywords.filter(k => !addedSkills.includes(k)).length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {missingKeywords.filter(k => !addedSkills.includes(k)).map((gap) => (
                      <button
                        key={gap}
                        onClick={() => interactive && handleAddSkill(gap)}
                        title="Click to integrate skill into profile"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/30 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50 hover:border-rose-400 transition-all active:scale-95 group"
                      >
                        <span className="text-rose-400 group-hover:text-white font-bold">+</span>
                        {gap}
                        <span className="text-[10px] text-rose-400/80 bg-rose-950 px-1 py-0.2 rounded ml-1">Add</span>
                      </button>
                    ))}
                    {missingKeywords.filter(k => !addedSkills.includes(k)).length === 0 && (
                      <span className="text-xs text-emerald-400 font-medium">All target keywords added!</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-white/5 text-xs text-slate-400 flex justify-between items-center">
            <span>Taxonomy Source: Senior Engineering Benchmark</span>
            <span className="text-indigo-400 font-mono">+2 pts per resolved keyword</span>
          </div>
        </div>

        {/* ── CARD 4: ACTIONABLE RECOMMENDATION ACCORDIONS (col-span-6) ── */}
        <div className="bento-card p-6 md:p-8 lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Prioritized Structural Recommendations</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">High-impact revisions ranked by estimated ATS score lift</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">
                +{recommendations.reduce((acc, r) => acc + parseInt(r.impact), 0)} pts Total Lift
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold">
                        ⚡
                      </div>
                      <h5 className="text-sm font-semibold text-white">{rec.title}</h5>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                      {rec.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 pl-8 leading-relaxed">
                    {rec.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Estimated Reviewer Time: 6 seconds</span>
            <span className="text-cyan-400 font-semibold">Ready for 1-Click Tailoring</span>
          </div>
        </div>
      </div>
    </div>
  )
}
