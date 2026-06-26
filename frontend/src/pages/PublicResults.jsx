import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ScoreGauge from '../components/ScoreGauge'
import api from '../services/api'

export default function PublicResults() {
  const { shareToken } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/resume/public/${shareToken}/analysis`)
      .then(res => setData(res.data))
      .catch(() => setError('Could not load analysis. This link may be invalid or expired.'))
      .finally(() => setLoading(false))
  }, [shareToken])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-slate-600">Loading analysis results…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md mx-auto">
        <p className="text-red-600 mb-6 font-medium">{error}</p>
        <Link to="/register" className="btn-primary inline-block">Create Your Own Analysis</Link>
      </div>
    </div>
  )

  const score = data?.atsScore ?? 0
  const skills = data?.skillsFound ?? []
  const missing = data?.missingKeywords ?? []
  const strengths = data?.strengths ?? []
  const improvements = data?.improvements ?? []
  const feedback = data?.feedback ?? ''
  const fileName = data?.resume?.fileName ?? 'Resume'

  return (
    <div className="min-h-screen p-4 md:p-8">

      <nav className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <span className="text-xl font-bold gradient-text">ResuMind</span>
        <Link to="/register" className="text-sm px-4 py-2 rounded-xl bg-blue-600 hover:bg-violet-700 text-slate-900 font-semibold transition-all duration-200">
          ✨ Analyze Your Resume
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto space-y-6 fade-in-up">

        <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">
          <ScoreGauge score={score} />
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Public Share Report</span>
            <h1 className="text-3xl font-bold text-slate-900 mt-1 mb-2">Resume Analysis: {fileName}</h1>
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


        <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-4">
          <h3 className="text-lg font-bold text-slate-900">Created using ResuMind</h3>
          <p className="text-slate-600 text-sm max-w-md">
            Analyze your resume, discover missing keywords, and get detailed feedback to beat the Applicant Tracking Systems (ATS).
          </p>
          <Link to="/register" className="btn-primary mt-2 px-8">
            Create Your Free Account & Analyze Now
          </Link>
        </div>
      </div>
    </div>
  )
}
