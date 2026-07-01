import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [googleFailed, setGoogleFailed] = useState(false)
  const googleBtnRef = useRef(null)
  const serverWarmRef = useRef(false)

  // Warm up the Render server on mount (while user types credentials)
  useEffect(() => {
    if (!serverWarmRef.current) {
      serverWarmRef.current = true
      api.get('/api/auth/ping').catch(() => {})
    }
  }, [])

  // Show contextual loading messages for slow connections
  useEffect(() => {
    if (!loading) { setLoadingMsg(''); return }
    setLoadingMsg('Signing in…')
    const t1 = setTimeout(() => setLoadingMsg('Connecting to server…'), 3000)
    const t2 = setTimeout(() => setLoadingMsg('Server is waking up, please wait…'), 8000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', form)
      if (!res.data.token) { setError('Invalid email or password.'); setLoading(false); return }
      login(res.data.token, res.data.user)
      navigate('/upload')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/google', { idToken: response.credential })
      if (!res.data.token) {
        setError('Google login failed.')
        setLoading(false)
        return
      }
      login(res.data.token, res.data.user)
      navigate('/upload')
    } catch (err) {
      setError(err.response?.data?.message || 'Google authentication failed.')
    } finally {
      setLoading(false)
    }
  }, [login, navigate])

  // Initialize Google Sign-In with responsive width
  useEffect(() => {
    const renderGoogleButton = () => {
      const container = googleBtnRef.current
      if (!window.google || !container) return false

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        setGoogleFailed(true)
        return false
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse
        })

        // Use container's actual width for responsive sizing
        const containerWidth = Math.min(container.offsetWidth, 400)
        container.innerHTML = '' // Clear before re-render
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: containerWidth,
          text: 'continue_with'
        })
        setGoogleReady(true)
        return true
      } catch {
        setGoogleFailed(true)
        return false
      }
    }

    // Poll for Google SDK availability (slow mobile networks)
    let attempts = 0
    const maxAttempts = 20
    const interval = setInterval(() => {
      attempts++
      if (renderGoogleButton() || attempts >= maxAttempts) {
        clearInterval(interval)
        if (attempts >= maxAttempts && !googleReady) {
          setGoogleFailed(true)
        }
      }
    }, 500)

    // Re-render on resize for responsive width
    const resizeObserver = new ResizeObserver(() => {
      if (googleReady && window.google) renderGoogleButton()
    })
    if (googleBtnRef.current) resizeObserver.observe(googleBtnRef.current)

    return () => {
      clearInterval(interval)
      resizeObserver.disconnect()
    }
  }, [handleGoogleResponse, googleReady])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24">
      <div className="glass-card w-full max-w-md p-8 fade-in-up">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{background:'linear-gradient(135deg,#7c3aed,#a855f7)'}}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gold-text">ResuMind</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>AI-Powered Resume Analyzer</p>
        </div>

        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Google Sign-In — responsive container */}
        <div className="w-full flex justify-center mb-6 min-h-[44px] relative"
             style={{ maxWidth: '100%' }}>
          {!googleReady && !googleFailed && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm py-2" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading Google Sign-In…
            </div>
          )}
          <div ref={googleBtnRef} className="w-full flex justify-center"
               style={{ visibility: googleReady ? 'visible' : 'hidden', overflow: 'hidden' }} />
        </div>

        {googleFailed && (
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm text-center">
            Google Sign-In is unavailable. Please sign in with email below.
          </div>
        )}

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }}></div>
          <span className="flex-shrink mx-4 text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>or sign in with email</span>
          <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email address</label>
            <input id="login-email" type="email" required placeholder="you@example.com"
              className="input-field"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <div className="relative">
              <input id="login-password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                className="input-field pr-12"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 focus:outline-none transition-colors p-1"
                style={{ color: 'var(--text-tertiary)' }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-4 text-base tracking-wide shadow-md">
            {loading ? loadingMsg : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium transition-colors hover:opacity-80" style={{ color: 'var(--violet-500)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
