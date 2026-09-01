import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PILLAR_CONFIG = [
  { key: 'atsParseability', label: 'ATS Layout', icon: '📋', weight: '20%', color: '#7c3aed' },
  { key: 'hardSkillsScore', label: 'Hard Skills', icon: '🎯', weight: '30%', color: '#a855f7' },
  { key: 'impactScore', label: 'Impact', icon: '📊', weight: '25%', color: '#f59e0b' },
  { key: 'structuralScore', label: 'Structure', icon: '🏗️', weight: '15%', color: '#10b981' },
  { key: 'clarityScore', label: 'Clarity', icon: '✍️', weight: '10%', color: '#06b6d4' }
]

function AnimatedNumber({ value, duration = 1400 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || started.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.floor(eased * value))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value, duration])

  return <span ref={ref}>{display}</span>
}

function PillarGauge({ score, config, delay, details, verbReplacements }) {
  const [expanded, setExpanded] = useState(false)
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const scoreLabel = score >= 80 ? 'Strong' : score >= 60 ? 'Fair' : 'Weak'

  // Get detail data for this pillar
  const detailKeys = {
    atsParseability: 'ats_parseability',
    hardSkillsScore: 'hard_skills',
    impactScore: 'impact',
    structuralScore: 'structure',
    clarityScore: 'clarity'
  }
  const detail = details?.[detailKeys[config.key]] || {}

  return (
    <motion.div
      className="pillar-gauge-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.12, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <button
        className="pillar-gauge-inner"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${config.label} score: ${score}. Click to ${expanded ? 'collapse' : 'expand'} details.`}
      >
        {/* Circular Gauge */}
        <div className="pillar-gauge-svg-wrap">
          <svg width="92" height="92" viewBox="0 0 92 92">
            <circle cx="46" cy="46" r={radius} fill="none" stroke="var(--border-color)" strokeWidth="6" />
            <motion.circle
              cx="46" cy="46" r={radius}
              fill="none"
              stroke={config.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ delay: delay * 0.12 + 0.3, duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
              transform="rotate(-90 46 46)"
              style={{ filter: `drop-shadow(0 0 6px ${config.color}55)` }}
            />
          </svg>
          <div className="pillar-gauge-number">
            <AnimatedNumber value={score} />
          </div>
        </div>

        {/* Label */}
        <div className="pillar-gauge-label">
          <span className="pillar-gauge-icon">{config.icon}</span>
          <span className="pillar-gauge-title">{config.label}</span>
          <span className="pillar-gauge-weight">{config.weight}</span>
        </div>

        {/* Status Badge */}
        <span className="pillar-gauge-badge" style={{ backgroundColor: `${scoreColor}22`, color: scoreColor, borderColor: `${scoreColor}44` }}>
          {scoreLabel}
        </span>

        {/* Expand Indicator */}
        <svg className={`pillar-gauge-chevron ${expanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="pillar-gauge-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {detail.summary && (
              <p className="pillar-detail-summary">{detail.summary}</p>
            )}

            {/* Flags / Issues */}
            {detail.flags && detail.flags.length > 0 && (
              <div className="pillar-detail-section">
                <span className="pillar-detail-label">⚠️ Issues</span>
                <ul>
                  {detail.flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {/* Fixes */}
            {detail.fixes && detail.fixes.length > 0 && (
              <div className="pillar-detail-section">
                <span className="pillar-detail-label">🔧 Fixes</span>
                <ul>
                  {detail.fixes.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {/* Matched Skills */}
            {detail.matched && detail.matched.length > 0 && (
              <div className="pillar-detail-section">
                <span className="pillar-detail-label">✅ Matched</span>
                <div className="pillar-detail-chips">
                  {detail.matched.map((s, i) => (
                    <span key={i} className="pillar-chip pillar-chip-success">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gaps */}
            {detail.gaps && detail.gaps.length > 0 && (
              <div className="pillar-detail-section">
                <span className="pillar-detail-label">❌ Gaps</span>
                <div className="pillar-detail-chips">
                  {detail.gaps.map((s, i) => (
                    <span key={i} className="pillar-chip pillar-chip-danger">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Strong/Weak Bullets */}
            {detail.strong_bullets && detail.strong_bullets.length > 0 && (
              <div className="pillar-detail-section">
                <span className="pillar-detail-label">💪 Strong Bullets</span>
                <ul>{detail.strong_bullets.map((b, i) => <li key={i} className="text-emerald-600">{b}</li>)}</ul>
              </div>
            )}
            {detail.weak_bullets && detail.weak_bullets.length > 0 && (
              <div className="pillar-detail-section">
                <span className="pillar-detail-label">⚡ Needs Improvement</span>
                <ul>{detail.weak_bullets.map((b, i) => <li key={i} className="text-amber-600">{b}</li>)}</ul>
              </div>
            )}

            {/* Passive/Filler Counts */}
            {(detail.passive_count > 0 || detail.filler_count > 0) && (
              <div className="pillar-detail-section pillar-detail-counts">
                {detail.passive_count > 0 && <span>🔇 {detail.passive_count} passive voice instances</span>}
                {detail.filler_count > 0 && <span>💭 {detail.filler_count} filler phrases</span>}
              </div>
            )}

            {/* Verb Replacements (only show on Clarity pillar) */}
            {config.key === 'clarityScore' && verbReplacements && verbReplacements.length > 0 && (
              <div className="pillar-detail-section">
                <span className="pillar-detail-label">🔄 Verb Upgrades</span>
                <div className="verb-replacement-list">
                  {verbReplacements.map((vr, i) => (
                    <div key={i} className="verb-replacement-item">
                      <span className="verb-original">{vr.original}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                      <span
                        className="verb-replacement"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(vr.replacement)
                        }}
                        title="Click to copy"
                      >{vr.replacement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function PillarGauges({ data }) {
  const hasPillars = data?.atsParseability != null

  // Parse pillarDetails and verbReplacements if they are JSON strings
  let pillarDetails = data?.pillarDetails || {}
  let verbReplacements = data?.verbReplacements || []

  if (typeof pillarDetails === 'string') {
    try { pillarDetails = JSON.parse(pillarDetails) } catch { pillarDetails = {} }
  }
  if (typeof verbReplacements === 'string') {
    try { verbReplacements = JSON.parse(verbReplacements) } catch { verbReplacements = [] }
  }

  if (!hasPillars) {
    return (
      <div className="pillar-legacy-banner">
        <div className="pillar-legacy-icon">📊</div>
        <div>
          <h4>Detailed Breakdown Unavailable</h4>
          <p>This analysis was generated with an earlier version. Re-analyze your resume to get the full 5-pillar score breakdown with actionable insights.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pillar-gauges-grid">
      {PILLAR_CONFIG.map((config, i) => (
        <PillarGauge
          key={config.key}
          score={data[config.key] || 0}
          config={config}
          delay={i}
          details={pillarDetails}
          verbReplacements={verbReplacements}
        />
      ))}
    </div>
  )
}
