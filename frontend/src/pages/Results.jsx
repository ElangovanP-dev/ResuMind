import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ScoreGauge from '../components/ScoreGauge'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    if (data?.shareToken) {
      const shareUrl = `${window.location.origin}/public/results/${data.shareToken}`
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => {
          console.error('Failed to copy link:', err)
        })
    }
  }

  useEffect(() => {
    api.get(`/api/resume/${id}/analysis`)
      .then(res => setData(res.data))
      .catch(() => setError('Could not load analysis. Please try again.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-slate-600">Loading your results…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">Go Back</button>
      </div>
    </div>
  )

  const score = data?.atsScore ?? 0
  const skills = data?.skillsFound ?? []
  const missing = data?.missingKeywords ?? []
  const strengths = data?.strengths ?? []
  const improvements = data?.improvements ?? []
  const feedback = data?.feedback ?? ''

  return (
    <div className="min-h-screen p-4 md:p-8">

      <nav className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <span className="text-xl font-bold gradient-text">ResuMind</span>
        <div className="flex items-center gap-4">
          <Link to="/tailor" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">JD Tailor</Link>
          <Link to="/history" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">History</Link>
          <button onClick={logout} className="text-slate-600 hover:text-red-600 text-sm transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto space-y-6 fade-in-up">

        <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">
          <ScoreGauge score={score} />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume Analysis Complete</h1>
            <p className="text-slate-600 leading-relaxed max-w-xl">{feedback}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {score >= 80 && <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">🎯 ATS Optimised</span>}
              {score >= 60 && score < 80 && <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">⚡ Room to Improve</span>}
              {score < 60 && <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-600 border border-red-500/30">🔧 Needs Attention</span>}
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Skills Found
              <span className="ml-auto text-xs text-slate-500">{skills.length} skills</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="text-sm px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/25">
                  {s}
                </span>
              ))}
              {skills.length === 0 && <p className="text-slate-500 text-sm">No skills detected</p>}
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Missing Keywords
              <span className="ml-auto text-xs text-slate-500">{missing.length} keywords</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {missing.map((m, i) => (
                <span key={i} className="text-sm px-3 py-1 rounded-full bg-red-500/15 text-red-700 border border-red-500/25">
                  {m}
                </span>
              ))}
              {missing.length === 0 && <p className="text-slate-500 text-sm">Great! No missing keywords</p>}
            </div>
          </div>
        </div>


        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">💪 Strengths</h2>
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-emerald-500/5 border-l-4 border-emerald-500">
                <span className="text-emerald-600 font-bold text-sm mt-0.5">{i + 1}</span>
                <p className="text-slate-700 text-sm leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>


        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🚀 Suggested Improvements</h2>
          <div className="space-y-3">
            {improvements.map((imp, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-amber-500/5 border-l-4 border-amber-500">
                <span className="text-amber-600 font-bold text-sm mt-0.5">{i + 1}</span>
                <p className="text-slate-700 text-sm leading-relaxed">{imp}</p>
              </div>
            ))}
          </div>
        </div>


        <div className="flex flex-col sm:flex-row gap-4">
          <button id="upload-another-btn" onClick={() => navigate('/upload')} className="btn-primary flex-1 text-center">
            ↑ Upload Another
          </button>
          <button
            onClick={() => navigate('/tailor', { state: { resumeId: id } })}
            className="flex-1 text-center py-3 px-6 rounded-xl border border-blue-600 bg-indigo-600/10 text-blue-700 hover:bg-indigo-600/20 transition-all duration-200 font-semibold"
          >
            ✨ Tailor for a Job
          </button>
          <button onClick={handleShare} disabled={!data?.shareToken} className="flex-1 text-center py-3 px-6 rounded-xl border border-blue-600 bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 transition-all duration-200 font-semibold disabled:opacity-50">
            {copied ? '✓ Link Copied!' : '🔗 Share Analysis'}
          </button>
          <Link to="/history"
            className="flex-1 text-center py-3 px-6 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all duration-200 font-semibold">
            View History
          </Link>
        </div>
      </div>
    </div>
  )
}
