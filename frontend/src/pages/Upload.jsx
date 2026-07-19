import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GithubImport from '../components/GithubImport'
import api from '../services/api'

const MAX_SIZE = 5 * 1024 * 1024
const ANALYSIS_TIMEOUT_MS = 120000 // 120 seconds max for analysis
const MAX_RETRIES = 2 // auto-retry once on failure

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const inputRef = useRef(null)
  const abortControllerRef = useRef(null)
  const timeoutRef = useRef(null)

  // Github Import State
  const [isGithubOpen, setIsGithubOpen] = useState(false)
  const [importedBullets, setImportedBullets] = useState([])

  // Progressive loading messages during analysis
  useEffect(() => {
    if (!loading) {
      setLoadingMsg('')
      return
    }
    setLoadingMsg('Analyzing your resume…')
    const t1 = setTimeout(() => setLoadingMsg('Connecting to server…'), 3000)
    const t2 = setTimeout(() => setLoadingMsg('Server is waking up (free hosting), please wait…'), 8000)
    const t3 = setTimeout(() => setLoadingMsg('AI is analyzing your resume… almost ready!'), 20000)
    const t4 = setTimeout(() => setLoadingMsg('Still processing — complex resumes take a bit longer…'), 40000)
    const t5 = setTimeout(() => setLoadingMsg('Hang tight! Free hosting can be slow on first use. Almost done…'), 60000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [loading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

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

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setLoading(false)
    setError('')
    setLoadingMsg('')
    setRetryCount(0)
  }

  // Warm up the server before sending the actual file (wakes up Render from cold start)
  const warmUpServer = async () => {
    try {
      await api.get('/api/auth/ping', { timeout: 60000 }).catch(() => {})
    } catch {
      // Ignore — this is just a wake-up call
    }
  }

  const handleAnalyze = async (attempt = 0) => {
    if (!file) return
    setLoading(true)
    setError('')
    setRetryCount(attempt)

    // On first attempt, try to warm up the server
    if (attempt === 0) {
      setLoadingMsg('Waking up server…')
      await warmUpServer()
    }

    // Create abort controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Set a safety timeout
    timeoutRef.current = setTimeout(() => {
      controller.abort()
      // Auto-retry on timeout
      if (attempt < MAX_RETRIES - 1) {
        setLoadingMsg(`Request timed out — retrying automatically… (attempt ${attempt + 2}/${MAX_RETRIES})`)
        setTimeout(() => handleAnalyze(attempt + 1), 2000)
        return
      }
      setLoading(false)
      setError('Analysis timed out. The server may be experiencing heavy load — please tap "Retry" below.')
    }, ANALYSIS_TIMEOUT_MS)

    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: ANALYSIS_TIMEOUT_MS,
        signal: controller.signal,
      })
      clearTimeout(timeoutRef.current)
      navigate(`/results/${res.data.resume.id}`)
    } catch (err) {
      clearTimeout(timeoutRef.current)
      // Don't show error if user cancelled
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return

      // Auto-retry on timeout or network error (once)
      if (attempt < MAX_RETRIES - 1 && (err.isTimeout || err.isNetworkError || !err.response)) {
        setLoadingMsg(`Connection failed — retrying automatically… (attempt ${attempt + 2}/${MAX_RETRIES})`)
        setTimeout(() => handleAnalyze(attempt + 1), 3000)
        return
      }

      // Show detailed error
      let errorMsg
      if (err.isTimeout) {
        errorMsg = 'The server took too long to respond. It may be waking up from sleep — please tap "Retry".'
      } else if (err.isNetworkError) {
        errorMsg = 'Unable to reach the server. Please check your internet connection and try again.'
      } else if (err.response?.status === 401) {
        errorMsg = 'Your session has expired. Please log in again.'
      } else if (err.response?.status === 413) {
        errorMsg = 'File is too large. Please upload a PDF smaller than 5 MB.'
      } else {
        errorMsg = err.response?.data?.message || 'Analysis failed. Please try again.'
      }
      setError(errorMsg)
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError('')
    handleAnalyze(0)
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-4 md:px-8 md:pb-8">
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
              <p className="font-semibold text-lg" style={{ color: 'var(--violet-500)' }}>{loadingMsg}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This may take up to a minute on free hosting</p>
              {retryCount > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Auto-retry attempt {retryCount + 1} of {MAX_RETRIES}
                </p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel() }}
                className="mt-2 text-xs px-4 py-2 rounded-lg border transition-all hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                ✕ Cancel
              </button>
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
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center w-full">
              {error}
            </div>
            <button
              onClick={handleRetry}
              className="btn-primary px-8 py-3 text-sm font-bold shadow-md flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
            >
              🔄 Retry Analysis
            </button>
          </div>
        )}

        {!error && (
          <button
            id="analyze-btn"
            onClick={() => handleAnalyze(0)}
            disabled={!file || loading}
            className="btn-primary w-full py-3.5 mt-6 text-lg font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
          >
            {loading ? 'Analyzing…' : '✨ Analyze Resume'}
          </button>
        )}

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
