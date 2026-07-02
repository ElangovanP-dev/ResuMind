import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ScoreGauge from '../components/ScoreGauge'
import InterviewPredictor from '../components/InterviewPredictor'
import OutreachGenerator from '../components/OutreachGenerator'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function Tailor() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // State
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [error, setError] = useState('')
  
  // Results State
  const [result, setResult] = useState(null)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [copiedBulletIndex, setCopiedBulletIndex] = useState(null)
  const [expandedBulletIndex, setExpandedBulletIndex] = useState(null)

  // Sub-tabs state inside Results panel: 'report', 'interview', 'outreach'
  const [activeSubTab, setActiveSubTab] = useState('report')

  // Fetch user's resumes on mount
  useEffect(() => {
    api.get('/api/resume/history')
      .then(res => {
        setResumes(res.data)
        // Check if loading an existing tailored result from history
        if (location.state?.tailoredResult) {
          const tr = location.state.tailoredResult
          setSelectedResumeId(tr.resume.id)
          setJobDescription(tr.jobDescriptionText)
          setResult(tr)
        } else if (location.state?.resumeId) {
          setSelectedResumeId(location.state.resumeId)
        } else if (res.data.length > 0) {
          setSelectedResumeId(res.data[0].id)
        }
      })
      .catch(err => {
        console.error('Failed to fetch resumes:', err)
        setError('Could not load resumes. Please refresh.')
      })
      .finally(() => setLoadingResumes(false))
  }, [location.state])

  const handleTailor = async (e) => {
    e.preventDefault()
    if (!selectedResumeId || !jobDescription.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await api.post('/api/tailor/run', {
        resumeId: Number(selectedResumeId),
        jobDescription: jobDescription.trim()
      })
      setResult(res.data)
      setActiveSubTab('report') // reset to report tab on run
    } catch (err) {
      setError(err.response?.data?.message || 'Tailoring failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, type, index = null) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        if (type === 'summary') {
          setCopiedSummary(true)
          setTimeout(() => setCopiedSummary(false), 2000)
        } else if (type === 'bullet' && index !== null) {
          setCopiedBulletIndex(index)
          setTimeout(() => setCopiedBulletIndex(null), 2000)
        }
      })
      .catch(err => {
        console.error('Could not copy text: ', err)
      })
  }

  return (
    <div className="min-h-screen pt-24 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start fade-in-up">
        {/* Left Input Panel */}
        <div className="lg:col-span-5 glass-card p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>JD Tailoring <span className="gold-text">Engine</span></h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Paste the job description of your target role and select a resume. Gemini AI will optimize your experience bullets, identify missing keywords, and tailor your profile summary.
            </p>
          </div>

          <form onSubmit={handleTailor} className="space-y-5">
            {/* Resume Selection */}
            <div>
              <label className="block font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Select Resume</label>
              {loadingResumes ? (
                <div className="h-12 bg-slate-100/40 rounded-xl animate-pulse" />
              ) : resumes.length === 0 ? (
                <div className="p-4 rounded-xl bg-violet-600/5 border border-themed text-center text-sm">
                  <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>No resumes uploaded yet.</p>
                  <Link to="/upload" className="font-semibold hover:underline" style={{ color: 'var(--violet-500)' }}>Upload your first resume ↑</Link>
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={e => setSelectedResumeId(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id} className="bg-themed text-themed-primary">
                      {r.fileName} (ATS: {r.atsScore ?? 'N/A'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Job Description Textarea */}
            <div>
              <label className="block font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Target Job Description</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job requirements, responsibilities, and qualifications here..."
                rows={12}
                className="input-field resize-none text-sm font-sans"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || resumes.length === 0 || !jobDescription.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Tailoring with AI…
                </>
              ) : (
                '✨ Tailor My Resume'
              )}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="spinner mb-6" />
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Analyzing JD and Optimizing Resume...</h3>
              <p className="text-xs max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                Google Gemini is reviewing requirements, matching keywords, and rewriting work experience bullet points. This takes about 4-6 seconds.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-6 fade-in-up">
              
              {/* Output Sub-Tabs */}
              <div className="flex border-b border-themed pb-2.5 gap-2">
                {[
                  { id: 'report', name: '📋 Tailoring Report' },
                  { id: 'interview', name: '🎯 Interview Prep' },
                  { id: 'outreach', name: '✉️ Recruiter Outreach' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all duration-200 ${
                      activeSubTab === tab.id
                        ? 'bg-violet-600/20 text-violet-500 border border-violet-500/30'
                        : 'text-themed-secondary hover:text-violet-400 border border-transparent'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeSubTab === 'report' && (
                <div className="space-y-6">
                  {/* Score card */}
                  <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 border-themed">
                    <ScoreGauge score={result.matchScore} />
                    <div>
                      <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Job Match: {result.matchScore}%</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Based on keywords and skill alignment, your resume currently has a{' '}
                        <strong>{result.matchScore}% match</strong> for this job description. Incorporate the rewritten bullets and missing skills below to raise it.
                      </p>
                    </div>
                  </div>

                  {/* Missing Keywords & Suggested Skills */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Keywords */}
                    <div className="glass-card p-6">
                      <h4 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords && result.missingKeywords.length > 0 ? (
                          result.missingKeywords.map((kw, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                              + {kw}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No missing keywords identified!</p>
                        )}
                      </div>
                    </div>

                    {/* Suggested Skills */}
                    <div className="glass-card p-6">
                      <h4 className="text-sm font-semibold text-emerald-500 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Suggested Skills Section
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.suggestedSkills && result.suggestedSkills.length > 0 ? (
                          result.suggestedSkills.map((sk, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {sk}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No extra skills suggested.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  {result.tailoredSummary && (
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold animate-pulse" style={{ color: 'var(--text-primary)' }}>✨ Tailored Professional Summary</h4>
                        <button
                          onClick={() => copyToClipboard(result.tailoredSummary, 'summary')}
                          className="text-xs px-3 py-1.5 rounded-xl border border-themed font-semibold hover:bg-violet-500/10 transition-all duration-200"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {copiedSummary ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed p-4 rounded-xl border border-themed font-sans italic" style={{ color: 'var(--text-secondary)', background: 'var(--bg-page)' }}>
                        "{result.tailoredSummary}"
                      </p>
                    </div>
                  )}

                  {/* Rewritten Bullet Points */}
                  {result.rewrittenBullets && result.rewrittenBullets.length > 0 && (
                    <div className="glass-card p-6 space-y-4">
                      <div>
                        <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>✍️ AI-Rewritten Experience Bullets</h4>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Click on any bullet to view its original version and compare them.</p>
                      </div>

                      <div className="space-y-2">
                        {result.rewrittenBullets.map((bullet, idx) => {
                          const isExpanded = expandedBulletIndex === idx
                          const isCopied = copiedBulletIndex === idx

                          return (
                            <div
                              key={idx}
                              className="border rounded-xl overflow-hidden transition-colors border-themed bg-themed-surface/20"
                            >
                              {/* Header row (shows rewritten version) */}
                              <div
                                className="p-4 flex gap-3 cursor-pointer items-start justify-between"
                                onClick={() => setExpandedBulletIndex(isExpanded ? null : idx)}
                              >
                                <div className="flex gap-2.5 items-start">
                                  <span className="text-xs px-2 py-0.5 rounded font-mono mt-0.5" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--violet-400)' }}>
                                    {idx + 1}
                                  </span>
                                  <p className="text-sm leading-relaxed pr-2" style={{ color: 'var(--text-primary)' }}>
                                    {bullet.rewritten}
                                  </p>
                                </div>
                                
                                <div className="flex gap-2 items-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => copyToClipboard(bullet.rewritten, 'bullet', idx)}
                                    className="p-1.5 rounded hover:bg-violet-500/10 transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    title="Copy tailored bullet"
                                  >
                                    {isCopied ? (
                                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                    )}
                                  </button>
                                  
                                  <button
                                    onClick={() => setExpandedBulletIndex(isExpanded ? null : idx)}
                                    className="p-1.5 rounded hover:bg-violet-500/10 transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    <svg
                                      className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Accordion content (shows original version) */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 border-t border-themed bg-themed-surface/40">
                                  <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--text-tertiary)' }}>Original Bullet</span>
                                  <p className="text-sm line-through decoration-red-500/50 leading-relaxed font-sans pr-4" style={{ color: 'var(--text-secondary)' }}>
                                    {bullet.original}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'interview' && (
                <InterviewPredictor resumeId={selectedResumeId} jobDescription={jobDescription} />
              )}

              {activeSubTab === 'outreach' && (
                <OutreachGenerator resumeId={selectedResumeId} />
              )}

            </div>
          ) : (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[500px] border-dashed border-2 border-themed">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--border-color)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Optimization Run Yet</h3>
              <p className="text-xs max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                Select your resume, paste the target Job Description on the left, and click "Tailor My Resume" to generate results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
