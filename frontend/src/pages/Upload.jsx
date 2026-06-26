import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const MAX_SIZE = 5 * 1024 * 1024

export default function Upload() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

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
    <div className="min-h-screen p-4 md:p-8">

      <nav className="max-w-3xl mx-auto flex items-center justify-between mb-10">
        <span className="text-xl font-bold gradient-text">ResuMind</span>
        <div className="flex items-center gap-4">
          <Link to="/tailor" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">JD Tailor</Link>
          <Link to="/history" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">History</Link>
          <button onClick={logout}
            className="text-slate-600 hover:text-red-600 text-sm transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Analyze Your <span className="gradient-text">Resume</span>
          </h1>
          <p className="text-slate-600 text-lg">
            Upload your PDF resume and get instant AI-powered feedback, ATS score, and improvement tips.
          </p>
        </div>


        <div
          className={`glass-card p-10 text-center cursor-pointer transition-all duration-300 ${
            dragging
              ? 'border-blue-600 bg-blue-600/10 scale-[1.01]'
              : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'hover:border-slate-600'
          }`}
          style={{ borderWidth: '2px', borderStyle: 'dashed' }}
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
              <p className="text-blue-600 font-semibold text-lg">Analyzing your resume…</p>
              <p className="text-slate-500 text-sm">This may take a few seconds</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-900 font-semibold text-lg truncate max-w-xs">{file.name}</p>
              <p className="text-slate-600 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
              <button
                className="text-slate-500 hover:text-slate-700 text-xs mt-1 transition-colors"
                onClick={e => { e.stopPropagation(); setFile(null) }}>
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                   style={{background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))'}}>
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-slate-900 font-semibold text-lg">
                  Drop your PDF here, or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-slate-500 text-sm mt-1">Supports: PDF only · Max size: 5 MB</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <button
          id="analyze-btn"
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="btn-primary w-full mt-6 text-lg"
        >
          {loading ? 'Analyzing…' : '✨ Analyze Resume'}
        </button>
      </div>
    </div>
  )
}
