import { useEffect, useState } from 'react'
import api from '../services/api'

export default function InterviewPredictor({ resumeId, jobDescription }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(0)

  useEffect(() => {
    if (!resumeId || !jobDescription) return
    setLoading(true)
    setError('')
    api.post('/api/premium/interview-predict', { resumeId, jobDescription })
      .then(res => setData(res.data))
      .catch(() => setError('Failed to generate interview question predictions.'))
      .finally(() => setLoading(false))
  }, [resumeId, jobDescription])

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
      <div className="spinner" />
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Predicting behavioral questions...</p>
    </div>
  )

  if (error) return (
    <div className="p-6 text-center text-red-500 text-sm font-medium">
      {error}
    </div>
  )

  const questions = data?.questions || []

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Predicted Behavioral <span className="gold-text">Interview Questions</span>
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Based on the experience gaps between your resume and the target Job Description, Gemini predicts these core questions.
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isExpanded = expandedIndex === idx
          const star = q.starAnswer || {}
          return (
            <div key={idx} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-sm md:text-base transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                <div className="flex gap-3 pr-4">
                  <span className="gold-text">Q{idx + 1}.</span>
                  <span>{q.question}</span>
                </div>
                <svg className={`faq-chevron w-5 h-5 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-secondary)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="p-5 pt-0 border-t border-themed space-y-4" style={{ background: 'var(--bg-page)' }}>
                  <div className="mt-4">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-violet-500/10 text-violet-500 mb-3 tracking-wider">
                      Suggested STAR Template
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-themed" style={{ background: 'var(--bg-surface)' }}>
                        <h4 className="text-xs font-bold text-violet-500 uppercase tracking-wide mb-1">Situation (S)</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{star.situation}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-themed" style={{ background: 'var(--bg-surface)' }}>
                        <h4 className="text-xs font-bold text-violet-500 uppercase tracking-wide mb-1">Task (T)</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{star.task}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-themed md:col-span-2" style={{ background: 'var(--bg-surface)' }}>
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">Action (A)</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{star.action}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-themed md:col-span-2" style={{ background: 'var(--bg-surface)' }}>
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">Result (R)</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{star.result}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
