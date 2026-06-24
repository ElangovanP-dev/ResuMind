import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function ScoreBadge({ score }) {
  const color =
    score >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
    score >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30'
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
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/resume/history')
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Navbar */}
      <nav className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <span className="text-xl font-bold gradient-text">ResuMind</span>
        <div className="flex items-center gap-4">
          <Link to="/upload" className="text-slate-400 hover:text-white text-sm transition-colors">Upload</Link>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 text-sm transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Upload History</h1>
            <p className="text-slate-400 mt-1 text-sm">Your past resume analyses</p>
          </div>
          <Link to="/upload" className="btn-primary text-sm">
            + New Analysis
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="glass-card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-lg mb-4">No resumes analyzed yet</p>
            <Link to="/upload" className="btn-primary inline-block">Upload your first resume</Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/results/${item.id}`)}
                className="glass-card p-5 text-left hover:border-indigo-500/50 transition-all duration-200 hover:scale-[1.02] group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <ScoreBadge score={item.atsScore} />
                </div>
                <p className="text-white font-medium text-sm truncate mb-1 group-hover:text-indigo-300 transition-colors">
                  {item.fileName}
                </p>
                <p className="text-slate-500 text-xs">{formatDate(item.uploadedAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
