import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AnalysisProgress from '../components/AnalysisProgress'
import GithubImport from '../components/GithubImport'
import api from '../services/api'

const MAX_SIZE = 5 * 1024 * 1024
const ANALYSIS_TIMEOUT_MS = 120000 // 120 seconds max for analysis
const MAX_RETRIES = 3 // auto-retry up to 3 times on cold start / network timeout

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [isValidatingClient, setIsValidatingClient] = useState(false)
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

  // Pre-warm the backend server as soon as the page loads
  useEffect(() => {
    api.get('/api/auth/ping', { timeout: 15000 }).catch(() => {})
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Client-Side Pre-Validation: Format, Size, & PDF Header Signature
  const validateAndSet = async (f) => {
    if (!f) return
    setError('')
    setIsValidatingClient(true)

    // 1. Extension check
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file format. Only PDF files are accepted.')
      setIsValidatingClient(false)
      return
    }

    // 2. MIME type check
    if (f.type && f.type !== 'application/pdf') {
      setError('MIME type mismatch. File must be a valid application/pdf.')
      setIsValidatingClient(false)
      return
    }

    // 3. File size check
    if (f.size > MAX_SIZE) {
      setError('File is too large. Maximum allowed size is 5 MB.')
      setIsValidatingClient(false)
      return
    }
    if (f.size < 100) {
      setError('File appears to be empty or corrupted.')
      setIsValidatingClient(false)
      return
    }

    // 4. Binary header verification (check for %PDF-)
    try {
      const slice = f.slice(0, 8)
      const buffer = await slice.arrayBuffer()
      const headerStr = new TextDecoder('ascii').decode(buffer)
      if (!headerStr.startsWith('%PDF-')) {
        setError('Corrupted or invalid PDF file header.')
        setIsValidatingClient(false)
        return
      }
    } catch {
      // Fallback if ArrayBuffer read fails
    }

    setError('')
    setFile(f)
    setIsValidatingClient(false)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0])
    }
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

  // Fast, non-blocking wake-up ping
  const warmUpServer = async () => {
    try {
      await api.get('/api/auth/ping', { timeout: 15000 }).catch(() => {})
    } catch {
      // Ignore background wake-up
    }
  }

  const handleAnalyze = async (attempt = 0) => {
    if (!file) return
    setLoading(true)
    setError('')
    setRetryCount(attempt)

    if (attempt === 0) {
      setLoadingMsg('Connecting to analysis engine…')
      warmUpServer()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    timeoutRef.current = setTimeout(async () => {
      controller.abort()
      if (attempt < MAX_RETRIES - 1) {
        setLoadingMsg(`Request timed out — waking server & retrying… (attempt ${attempt + 2}/${MAX_RETRIES})`)
        await warmUpServer()
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
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return

      if (attempt < MAX_RETRIES - 1 && (err.isTimeout || err.isNetworkError || !err.response)) {
        setLoadingMsg(`Connection failed — waking server & retrying… (attempt ${attempt + 2}/${MAX_RETRIES})`)
        await warmUpServer()
        setTimeout(() => handleAnalyze(attempt + 1), 2000)
        return
      }

      let errorMsg
      if (err.isTimeout) {
        errorMsg = 'The server took too long to respond. It may be waking up from sleep — please tap "Retry".'
      } else if (err.isNetworkError) {
        errorMsg = 'Unable to reach the server. Please check your connection and tap "Retry".'
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

  const handleRetry = async () => {
    setError('')
    setLoading(true)
    setLoadingMsg('Waking up server…')
    await warmUpServer()
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
            Upload your PDF resume to receive deep 5-pillar ATS scoring, STAR accomplishment metrics, and active verb upgrades.
          </p>
        </div>

        {!loading && (
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
            onClick={() => inputRef.current.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            id="drop-zone"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={e => validateAndSet(e.target.files[0])}
            />

            {isValidatingClient ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="spinner" />
                <p className="text-sm font-semibold" style={{ color: 'var(--violet-500)' }}>
                  Pre-validating PDF structure…
                </p>
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
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                    ✓ PDF Validated
                  </span>
                </div>
                <p className="font-semibold text-lg truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready for Analysis</p>
                <button
                  className="text-xs mt-1 transition-colors hover:text-violet-500 underline"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={e => { e.stopPropagation(); setFile(null) }}>
                  Choose another file
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
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Supports: Text-searchable PDF · Max size: 5 MB</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Analysis Progress Stages Card */}
        {loading && (
          <div className="space-y-4">
            <AnalysisProgress isActive={loading} />
            <div className="flex justify-center">
              <button
                onClick={handleCancel}
                className="text-xs px-4 py-2 rounded-lg border transition-all hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                ✕ Cancel Analysis
              </button>
            </div>
          </div>
        )}

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

        {!error && !loading && (
          <button
            id="analyze-btn"
            onClick={() => handleAnalyze(0)}
            disabled={!file || loading}
            className="btn-primary w-full py-3.5 mt-6 text-lg font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
          >
            ✨ Run 5-Pillar Analysis
          </button>
        )}

        {/* GitHub Project Bullet Helper Section */}
        <div className="mt-12 glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-themed">
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>🛠️ Build high-impact project bullets from GitHub</h4>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Connect a repository and auto-write STAR-formatted resume bullets.</p>
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
