import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function ScoreBadge({ score }) {
  const color =
    score >= 80 ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' :
    score >= 60 ? 'bg-amber-500/20 text-amber-600 border-amber-500/30' :
    'bg-red-500/20 text-red-600 border-red-500/30'
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${color}`}>
      {score}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function History() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [tailoredResults, setTailoredResults] = useState([])
  const [activeTab, setActiveTab] = useState('resumes') // 'resumes' or 'tailoring'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    if (activeTab === 'resumes') {
      api.get('/api/resume/history')
        .then(res => setResumes(res.data))
        .catch(() => setError('Failed to load resume history.'))
        .finally(() => setLoading(false))
    } else {
      api.get('/api/tailor/history')
        .then(res => setTailoredResults(res.data))
        .catch(() => setError('Failed to load tailoring history.'))
        .finally(() => setLoading(false))
    }
  }, [activeTab])

  return (
    <div className="min-h-screen p-4 md:p-8">

      <nav className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <span className="text-xl font-bold gradient-text cursor-pointer" onClick={() => navigate('/upload')}>ResuMind</span>
        <div className="flex items-center gap-4">
          <Link to="/tailor" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">JD Tailor</Link>
          <Link to="/upload" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">Upload</Link>
          <button onClick={logout} className="text-slate-600 hover:text-red-600 text-sm transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto fade-in-up">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your History</h1>
            <p className="text-slate-600 mt-1 text-sm">Review your past ATS analyses and JD tailoring runs</p>
          </div>
          <div className="flex gap-2">
            <Link to="/upload" className="btn-primary text-sm py-2.5">
              + New Analysis
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('resumes')}
            className={`pb-3 font-semibold text-sm transition-all relative ${
              activeTab === 'resumes' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ATS Resume Scores
            {activeTab === 'resumes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tailoring')}
            className={`pb-3 font-semibold text-sm transition-all relative ${
              activeTab === 'tailoring' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✨ JD Tailored Resumes
            {activeTab === 'tailoring' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Resume tab list */}
        {!loading && !error && activeTab === 'resumes' && (
          <>
            {resumes.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg mb-4">No resumes analyzed yet</p>
                <Link to="/upload" className="btn-primary inline-block">Upload your first resume</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/results/${item.id}`)}
                    className="glass-card p-5 text-left hover:border-blue-600/50 transition-all duration-200 hover:scale-[1.02] group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <ScoreBadge score={item.atsScore} />
                    </div>
                    <p className="text-slate-900 font-medium text-sm truncate mb-1 group-hover:text-blue-700 transition-colors">
                      {item.fileName}
                    </p>
                    <p className="text-slate-500 text-xs">{formatDate(item.uploadedAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tailored Results list */}
        {!loading && !error && activeTab === 'tailoring' && (
          <>
            {tailoredResults.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg mb-4">No resumes tailored to JDs yet</p>
                <Link to="/tailor" className="btn-primary inline-block">Tailor a resume now</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tailoredResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate('/tailor', { state: { tailoredResult: item } })}
                    className="glass-card p-5 text-left hover:border-blue-600/50 transition-all duration-200 hover:scale-[1.01] group flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-700 font-bold border border-blue-600/30">
                          {item.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mb-2 italic line-clamp-2">
                        "{item.jobDescriptionText}"
                      </p>
                    </div>

                    <div className="border-t border-slate-200/80 pt-3 mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Resume: <strong className="text-slate-600 font-medium">{item.resume?.fileName}</strong></span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
