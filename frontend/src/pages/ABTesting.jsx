import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import ScoreGauge from '../components/ScoreGauge'

export default function ABTesting() {
  const navigate = useNavigate()
  
  // Selection/Upload State
  const [resumes, setResumes] = useState([])
  const [resumeIdA, setResumeIdA] = useState('')
  const [resumeIdB, setResumeIdB] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [error, setError] = useState('')

  // Results State
  const [result, setResult] = useState(null)

  useEffect(() => {
    setLoadingResumes(true)
    api.get('/api/resume/history')
      .then(res => {
        setResumes(res.data)
        if (res.data.length > 0) {
          setResumeIdA(res.data[0].id)
        }
        if (res.data.length > 1) {
          setResumeIdB(res.data[1].id)
        }
      })
      .catch(() => setError('Failed to load resume history.'))
      .finally(() => setLoadingResumes(false))
  }, [])

  const handleABTest = async (e) => {
    e.preventDefault()
    if (!resumeIdA || !resumeIdB || !jobDescription.trim()) {
      setError('Please select two resumes and enter a job description.')
      return
    }
    if (resumeIdA === resumeIdB) {
      setError('Please select two different resumes to compare.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await api.post('/api/premium/ab-test', {
        resumeIdA,
        resumeIdB,
        jobDescription
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'A/B Testing failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedResumeA = resumes.find(r => r.id.toString() === resumeIdA.toString())
  const selectedResumeB = resumes.find(r => r.id.toString() === resumeIdB.toString())

  return (
    <div className="min-h-screen pt-24 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 fade-in-up">
        
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Resume <span className="gold-text">A/B Testing</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Compare two resume versions side-by-side against a target job description to find the winning candidate profile.
          </p>
        </div>

        {loadingResumes ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="spinner" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading your resumes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Config Panel */}
            <form onSubmit={handleABTest} className="lg:col-span-5 glass-card p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Configure Test</h3>
                <div className="space-y-4">
                  {/* Select Resume A */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Version A</label>
                    <select
                      className="input-field"
                      value={resumeIdA}
                      onChange={e => setResumeIdA(e.target.value)}
                    >
                      <option value="">Select Resume Version A</option>
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>{r.fileName} ({new Date(r.uploadedAt).toLocaleDateString()})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Resume B */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Version B</label>
                    <select
                      className="input-field"
                      value={resumeIdB}
                      onChange={e => setResumeIdB(e.target.value)}
                    >
                      <option value="">Select Resume Version B</option>
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>{r.fileName} ({new Date(r.uploadedAt).toLocaleDateString()})</option>
                      ))}
                    </select>
                  </div>

                  {/* Target JD */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Target Job Description</label>
                    <textarea
                      required
                      placeholder="Paste the target job description or requirements here..."
                      className="input-field min-h-[160px] text-sm"
                      value={jobDescription}
                      onChange={e => setJobDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || resumes.length < 2}
                className="btn-primary w-full py-3.5 text-base tracking-wide"
              >
                {loading ? 'Running A/B Comparison...' : '📊 Run A/B Test'}
              </button>
              
              {resumes.length < 2 && (
                <p className="text-xs text-center text-amber-500 font-semibold mt-2">
                  Please upload at least 2 resumes to run A/B tests.
                </p>
              )}
            </form>

            {/* A/B Test Results Panel */}
            <div className="lg:col-span-7 space-y-6">
              {loading ? (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
                  <div className="spinner" />
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Analyzing profiles against requirements...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Side-by-Side Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Resume A */}
                    <div className="glass-card p-6 flex flex-col items-center text-center relative border-themed">
                      <span className="absolute top-3 left-3 text-xs font-extrabold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--violet-400)' }}>VERSION A</span>
                      <ScoreGauge score={result.scoreA} />
                      <p className="text-xs font-semibold mt-3 text-ellipsis overflow-hidden max-w-full" style={{ color: 'var(--text-secondary)' }}>
                        {selectedResumeA?.fileName}
                      </p>
                    </div>

                    {/* Resume B */}
                    <div className="glass-card p-6 flex flex-col items-center text-center relative border-themed">
                      <span className="absolute top-3 left-3 text-xs font-extrabold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--violet-400)' }}>VERSION B</span>
                      <ScoreGauge score={result.scoreB} />
                      <p className="text-xs font-semibold mt-3 text-ellipsis overflow-hidden max-w-full" style={{ color: 'var(--text-secondary)' }}>
                        {selectedResumeB?.fileName}
                      </p>
                    </div>
                  </div>

                  {/* Winner announcement */}
                  <div className="p-5 rounded-2xl border flex items-center gap-4 animate-pulse"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                    }}>
                    <div className="text-3xl">🏆</div>
                    <div>
                      <h4 className="font-extrabold text-emerald-500">Winner: {result.winner === 'Resume A' ? selectedResumeA?.fileName : selectedResumeB?.fileName}</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>This version matches target requirements more closely with optimized structures.</p>
                    </div>
                  </div>

                  {/* Winner Explanation */}
                  <div className="glass-card p-6">
                    <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Comparative Analysis</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {result.explanation}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate(`/results/${result.winner === 'Resume A' ? resumeIdA : resumeIdB}`)}
                      className="btn-primary flex-1 py-3 text-sm font-bold"
                    >
                      🚀 Go to Winner Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-center min-h-[400px] border-dashed border-2 border-themed">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--border-color)' }}>
                    <svg className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No test run yet</h3>
                  <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                    Select two resumes and enter target job criteria on the left to run comparisons.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
