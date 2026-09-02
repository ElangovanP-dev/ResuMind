import { useState, useRef } from 'react'

export default function IsometricResumeVisual() {
  const containerRef = useRef(null)
  const [rotate, setRotate] = useState({ x: 54, y: 12, z: -34 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Smooth responsive dynamic tilt offset
    const tiltX = 54 + (centerY - y) * 0.04
    const tiltY = 12 + (x - centerX) * 0.04
    setRotate({ x: tiltX, y: tiltY, z: -34 })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotate({ x: 54, y: 12, z: -34 })
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="isometric-perspective-stage w-full flex items-center justify-center py-6 select-none relative"
      style={{ minHeight: '520px' }}
    >
      {/* Background ambient radial glow */}
      <div 
        className="absolute w-80 h-80 rounded-full pointer-events-none filter blur-3xl opacity-30 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle, #6366F1 0%, #06B6D4 50%, transparent 80%)',
          transform: isHovered ? 'scale(1.2)' : 'scale(1)'
        }}
      />

      <div
        className="isometric-exploded-cluster isometric-animated-float"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateZ(${rotate.z}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* ━━━ LAYER 0: BASE RESUME DOCUMENT LAYER ━━━ */}
        <div className="isometric-layer isometric-layer-base p-6 text-slate-300 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h4 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  ALEX CHEN
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Senior Full-Stack Engineer</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">alex.chen@dev.io · San Francisco, CA · github.com/alexchen</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                1-COL ATS VALID
              </span>
            </div>

            {/* Experience Block 1 */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-white">
                  <span>Lead Software Engineer — CloudScale</span>
                  <span className="text-slate-400 text-[11px]">2022 – Present</span>
                </div>
                <ul className="mt-1.5 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                  <li>Architected distributed microservices serving 1.2M daily active requests with 99.98% SLA.</li>
                  <li>Engineered real-time Kafka data pipeline reducing synchronization latency by 42%.</li>
                </ul>
              </div>

              {/* Experience Block 2 */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs font-semibold text-white">
                  <span>Software Engineer — FinTech Core</span>
                  <span className="text-slate-400 text-[11px]">2019 – 2022</span>
                </div>
                <ul className="mt-1.5 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                  <li>Built responsive React/TypeScript client dashboards resulting in 28% higher onboarding velocity.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>Encoding: UTF-8</span>
            <span>Parse Tree Integrity: 100%</span>
          </div>
        </div>

        {/* ━━━ LAYER 1: ATS PARSE TREE LAYER ━━━ */}
        <div className="isometric-layer isometric-layer-parse p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded border border-indigo-400/30">
              ⚡ ATS PARSER NODE TREE
            </span>
            <span className="text-[10px] font-mono text-indigo-400">Greenhouse / Lever Ready</span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-auto">
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-[11px]">
              <span className="text-indigo-400 font-mono text-[9px] block">NODE 01: CONTACT_INFO</span>
              <p className="text-white font-medium">Valid Email & Phone</p>
              <span className="text-emerald-400 text-[10px]">✓ Clean Metadata</span>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-[11px]">
              <span className="text-indigo-400 font-mono text-[9px] block">NODE 02: TAXONOMY</span>
              <p className="text-white font-medium">Software Engineering</p>
              <span className="text-cyan-400 text-[10px]">99.4% Classifier Match</span>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-[11px]">
              <span className="text-indigo-400 font-mono text-[9px] block">NODE 03: HEADER_INTEGRITY</span>
              <p className="text-white font-medium">Standard Nomenclature</p>
              <span className="text-emerald-400 text-[10px]">✓ Zero Parse Faults</span>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-[11px]">
              <span className="text-indigo-400 font-mono text-[9px] block">NODE 04: CHRONOLOGY</span>
              <p className="text-white font-medium">Reverse Chronological</p>
              <span className="text-emerald-400 text-[10px]">✓ Unbroken Timeline</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-indigo-300/80 flex items-center justify-between">
            <span>[AST Node Count: 48]</span>
            <span>Parsing Latency: 42ms</span>
          </div>
        </div>

        {/* ━━━ LAYER 2: SKILLS RADAR & BADGES LAYER ━━━ */}
        <div className="isometric-layer isometric-layer-skills p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="live-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                SEMANTIC SKILL MATCH
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              96% Coverage
            </span>
          </div>

          {/* Floating Skill Badges */}
          <div className="flex flex-wrap gap-2 my-auto px-1">
            {[
              { name: 'React 18', level: '100%' },
              { name: 'TypeScript', level: '98%' },
              { name: 'Node.js', level: '95%' },
              { name: 'Java / Spring', level: '94%' },
              { name: 'AWS Cloud', level: '90%' },
              { name: 'Docker / K8s', level: '92%' },
              { name: 'PostgreSQL', level: '96%' },
              { name: 'GraphQL', level: '88%' },
            ].map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#0c1e17] text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-950"
              >
                <span className="text-emerald-400 text-xs">✓</span>
                {skill.name}
              </span>
            ))}
          </div>

          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex justify-between items-center text-[10px] text-emerald-200">
            <span>Hard Skills Alignment</span>
            <span className="font-bold text-emerald-400 font-mono">Pillar Score: 96 / 100</span>
          </div>
        </div>

        {/* ━━━ LAYER 3: HOLOGRAPHIC METRIC & BADGE OVERLAYS ━━━ */}
        <div className="isometric-layer isometric-layer-metrics p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-extrabold uppercase text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-400/40">
              🌟 HOLOGRAPHIC IMPACT
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">+38 Pts Upgrade</span>
          </div>

          {/* Large Floating KPI Cards */}
          <div className="space-y-3 my-auto">
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 border border-cyan-400/60 shadow-lg shadow-cyan-950/50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono text-cyan-300 uppercase">Composite ATS Benchmark</p>
                <h5 className="text-xl font-black text-white tracking-tight">96 / 100</h5>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                  TOP 2% TIER
                </span>
                <p className="text-[9px] text-slate-300 mt-1">Interview Rate: 8.4x</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-950/90 to-cyan-950/90 border border-violet-400/60 shadow-lg shadow-violet-950/50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono text-violet-300 uppercase">STAR Methodology</p>
                <h5 className="text-sm font-bold text-white">4 / 4 Metrics Quantified</h5>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/40">
                +42% Latency
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-cyan-300 font-mono">
            <span>Bias-Clean: 100%</span>
            <span>Executive Tone: Calibrated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
