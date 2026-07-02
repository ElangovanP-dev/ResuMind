import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function ScoreBadge({ score }) {
  if (!score && score !== 0) return null
  const color =
    score >= 80 ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' :
    score >= 60 ? 'bg-amber-500/20 text-amber-600 border-amber-500/30' :
    score > 0   ? 'bg-red-500/20 text-red-600 border-red-500/30' :
                  'bg-slate-100 text-slate-500 border-slate-300'
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${color}`}>
      {score > 0 ? score : 'N/A'}
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
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading) { setLoadingMsg(''); return }
    setLoadingMsg('Loading history…')
    const t1 = setTimeout(() => setLoadingMsg('Connecting to server…'), 3000)
    const t2 = setTimeout(() => setLoadingMsg('Waking up database server, please wait…'), 8000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loading])

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
    <div className="min-h-screen pt-24 px-4 pb-4 md:px-8 md:pb-8">

      <div className="max-w-5xl mx-auto fade-in-up">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Your <span className="gold-text">History</span></h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Review your past ATS analyses and JD tailoring runs</p>
          </div>
          <div className="flex gap-2">
            <Link to="/upload" className="btn-primary px-6 py-3 text-sm font-bold shadow-md flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200">
              ✨ Analyze Resume
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 gap-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('resumes')}
            className={`pb-3 font-semibold text-sm transition-all relative`}
            style={{ color: activeTab === 'resumes' ? 'var(--violet-500)' : 'var(--text-secondary)' }}
          >
            ATS Resume Scores
            {activeTab === 'resumes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--violet-500)' }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tailoring')}
            className={`pb-3 font-semibold text-sm transition-all relative`}
            style={{ color: activeTab === 'tailoring' ? 'var(--violet-500)' : 'var(--text-secondary)' }}
          >
            ✨ JD Tailored Resumes
            {activeTab === 'tailoring' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--violet-500)' }} />
            )}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="spinner" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{loadingMsg}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Resume tab list */}
        {!loading && !error && activeTab === 'resumes' && (
          <>
            {resumes.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--border-color)' }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>No resumes analyzed yet</p>
                <Link to="/upload" className="btn-primary inline-block">Upload your first resume</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/results/${item.id}`)}
                    className="glass-card p-5 text-left hover:scale-[1.02] group"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124, 58, 237, 0.15)' }}>
                        <svg className="w-5 h-5" style={{ color: 'var(--violet-500)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <ScoreBadge score={item.atsScore} />
                    </div>
                    <p className="font-medium text-sm truncate mb-1 transition-colors hover:text-violet-500" style={{ color: 'var(--text-primary)' }}>
                      {item.fileName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(item.uploadedAt)}</p>
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
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--border-color)' }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>No resumes tailored to JDs yet</p>
                <Link to="/tailor" className="btn-primary inline-block">Tailor a resume now</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tailoredResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate('/tailor', { state: { tailoredResult: item } })}
                    className="glass-card p-5 text-left hover:scale-[1.01] group flex flex-col justify-between min-h-[160px]"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124, 58, 237, 0.15)' }}>
                          <svg className="w-5 h-5" style={{ color: 'var(--violet-500)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold border"
                          style={{
                            background: 'rgba(124, 58, 237, 0.15)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--violet-400)'
                          }}>
                          {item.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-xs mb-2 leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {item.jobDescriptionText
                          ? item.jobDescriptionText.substring(0, 120) + (item.jobDescriptionText.length > 120 ? '…' : '')
                          : 'No description available'}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <span>Resume: <strong className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.resume?.fileName}</strong></span>
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
