import { useState } from 'react'
import api from '../services/api'

export default function OutreachGenerator({ resumeId }) {
  const [form, setForm] = useState({ companyName: '', recruiterName: '', jobRole: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedType, setCopiedType] = useState('') // 'email' or 'linkedin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.companyName || !form.jobRole) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/premium/outreach', {
        resumeId,
        companyName: form.companyName,
        recruiterName: form.recruiterName || 'Hiring Manager',
        jobRole: form.jobRole
      })
      setData(res.data)
    } catch (err) {
      setError('Failed to generate outreach templates.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedType(type)
        setTimeout(() => setCopiedType(''), 2000)
      })
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Recruiter <span className="gold-text">Outreach Generator</span>
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Quickly generate highly-tailored connection messages based on your resume matching the target position.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end glass-card p-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Company Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Google"
            className="input-field"
            value={form.companyName}
            onChange={e => setForm({ ...form, companyName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Job Title / Role</label>
          <input
            type="text"
            required
            placeholder="e.g. Software Engineer"
            className="input-field"
            value={form.jobRole}
            onChange={e => setForm({ ...form, jobRole: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Recruiter Name (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Sarah"
            className="input-field"
            value={form.recruiterName}
            onChange={e => setForm({ ...form, recruiterName: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-3 md:col-span-3 mt-2 text-sm font-semibold tracking-wide"
        >
          {loading ? 'Generating Messages...' : '✉️ Generate Cold Messages'}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Card */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>📧 Personalized Cold Email</h4>
                <button
                  onClick={() => copyText(data.emailTemplate, 'email')}
                  className="text-xs px-3 py-1.5 rounded-xl border border-themed font-semibold hover:bg-violet-500/10 transition-all duration-200"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {copiedType === 'email' ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-themed"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                {data.emailTemplate}
              </pre>
            </div>
          </div>

          {/* LinkedIn Card */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>💬 LinkedIn Connect Note</h4>
                <button
                  onClick={() => copyText(data.linkedinTemplate, 'linkedin')}
                  className="text-xs px-3 py-1.5 rounded-xl border border-themed font-semibold hover:bg-violet-500/10 transition-all duration-200"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {copiedType === 'linkedin' ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-themed"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                {data.linkedinTemplate}
              </pre>
              <p className="text-[10px] italic mt-3 text-right" style={{ color: 'var(--text-tertiary)' }}>
                Designed to fit LinkedIn's 300 character limit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
