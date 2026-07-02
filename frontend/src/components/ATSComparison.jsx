import { useEffect, useState } from 'react'
import api from '../services/api'

export default function ATSComparison({ resumeId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!resumeId) return
    setLoading(true)
    setError('')
    api.post('/api/premium/ats-simulator', { resumeId })
      .then(res => setData(res.data))
      .catch(() => setError('Failed to run ATS platform simulation.'))
      .finally(() => setLoading(false))
  }, [resumeId])

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
      <div className="spinner" />
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Simulating ATS parsers...</p>
    </div>
  )

  if (error) return (
    <div className="p-6 text-center text-red-500 text-sm font-medium">
      {error}
    </div>
  )

  const platforms = [
    { key: 'workday', name: 'Workday', logo: '☁️', color: 'border-blue-500/30 shadow-blue-500/5' },
    { key: 'greenhouse', name: 'Greenhouse', logo: '🌿', color: 'border-emerald-500/30 shadow-emerald-500/5' },
    { key: 'lever', name: 'Lever', logo: '🕹️', color: 'border-amber-500/30 shadow-amber-500/5' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {platforms.map(plat => {
          const sim = data?.[plat.key] || {}
          const score = sim.readabilityScore ?? 0
          const colorClass =
            score >= 80 ? 'text-emerald-500' :
            score >= 60 ? 'text-amber-500' :
                          'text-red-500'

          return (
            <div key={plat.key} className={`glass-card p-6 border ${plat.color} flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{plat.logo}</span>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{plat.name}</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border`}
                    style={{
                      background: score >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      borderColor: score >= 80 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                      color: score >= 80 ? 'var(--color-success)' : 'var(--text-gold)'
                    }}>
                    {sim.parserType}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-themed-surface/20" style={{ background: 'var(--bg-page)', opacity: 0.85 }}>
                  <div className="text-3xl font-extrabold flex flex-col items-center">
                    <span className={colorClass}>{score}</span>
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Score</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Extracted **{sim.extractedSkills?.length || 0} skills** successfully.
                  </p>
                </div>

                {sim.warnings && sim.warnings.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-500">Parsing Warnings:</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {sim.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {sim.droppedContent && (
                <div className="mt-4 pt-4 border-t border-themed">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">Likely Dropped Content:</h4>
                  <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {sim.droppedContent}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
