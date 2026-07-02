import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GithubImport from '../components/GithubImport'
import api from '../services/api'

const MAX_SIZE = 5 * 1024 * 1024

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Github Import State
  const [isGithubOpen, setIsGithubOpen] = useState(false)
  const [importedBullets, setImportedBullets] = useState([])

  const validateAndSet = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF files are accepted.'); return }
    if (f.size > MAX_SIZE) { setError('File must be smaller than 5 MB.'); return }
    setError('')
    setFile(f)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    validateAndSet(e.dataTransfer.files[0])
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate(`/results/${res.data.resume.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 p-4 md:p-8">
      <div className="max-w-3xl mx-auto fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Analyze Your <span className="gold-text">Resume</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Upload your PDF resume and get instant AI-powered feedback, ATS score, and improvement tips.
          </p>
        </div>

        <div
          className={`glass-card p-10 text-center cursor-pointer transition-all duration-300 ${
            dragging
              ? 'border-violet-500 scale-[1.01]'
              : file
              ? 'border-emerald-500/50'
              : ''
          }`}
          style={{
            borderWidth: '2px',
            borderStyle: 'dashed',
            borderColor: dragging ? '#7c3aed' : file ? 'rgba(16,185,129,0.5)' : 'var(--border-color)',
            background: dragging ? 'rgba(124,58,237,0.05)' : file ? 'rgba(16,185,129,0.03)' : 'var(--bg-surface)',
          }}
          onClick={() => !loading && inputRef.current.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          id="drop-zone"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => validateAndSet(e.target.files[0])}
          />

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="spinner" />
              <p className="font-semibold text-lg" style={{ color: 'var(--violet-500)' }}>Analyzing your resume…</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This may take a few seconds</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-lg truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
              <button
                className="text-xs mt-1 transition-colors hover:text-violet-500"
                style={{ color: 'var(--text-secondary)' }}
                onClick={e => { e.stopPropagation(); setFile(null) }}>
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                   style={{ background: 'rgba(124,58,237,0.1)' }}>
                <svg className="w-10 h-10" style={{ color: 'var(--violet-500)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  Drop your PDF here, or <span style={{ color: 'var(--violet-500)' }}>browse</span>
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Supports: PDF only · Max size: 5 MB</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <button
          id="analyze-btn"
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="btn-primary w-full py-3.5 mt-6 text-lg font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
        >
          {loading ? 'Analyzing…' : '✨ Analyze Resume'}
        </button>

        {/* GitHub Project Bullet Helper Section */}
        <div className="mt-12 glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-themed">
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>🛠️ Build high-impact project bullets from GitHub</h4>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Connect a repository and auto-write optimized resume-ready bullets.</p>
          </div>
          <button
            onClick={() => setIsGithubOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-themed text-xs font-semibold hover:bg-violet-500/10 transition-all duration-200"
            style={{ color: 'var(--text-primary)' }}
          >
            🐈 Import from GitHub
          </button>
        </div>

        {importedBullets.length > 0 && (
          <div className="mt-6 glass-card p-6 border-l-4 border-violet-500 space-y-4">
            <h4 className="font-extrabold text-sm gold-text">Generated GitHub Resume Bullets</h4>
            <div className="space-y-3">
              {importedBullets.map((b, idx) => (
                <div key={idx} className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                  {b}
                </div>
              ))}
            </div>
          </div>
        )}

        <GithubImport
          isOpen={isGithubOpen}
          onClose={() => setIsGithubOpen(false)}
          onImport={(bullets) => setImportedBullets(bullets)}
        />
      </div>
    </div>
  )
}
