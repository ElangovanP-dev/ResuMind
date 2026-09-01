import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false })
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '' })
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [googleFailed, setGoogleFailed] = useState(false)
  const googleBtnRef = useRef(null)
  const serverWarmRef = useRef(false)

  // Warm up the server on mount
  useEffect(() => {
    if (!serverWarmRef.current) {
      serverWarmRef.current = true
      api.get('/api/auth/ping').catch(() => {})
    }
  }, [])

  // 300ms debounced real-time field validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const newErrors = { name: '', email: '', password: '', confirm: '' }

      if (touched.name && form.name && form.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters.'
      }

      if (touched.email && form.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
          newErrors.email = 'Please enter a valid email address.'
        }
      }

      if (touched.password && form.password) {
        if (form.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters.'
        }
      }

      if (touched.confirm && form.confirm) {
        if (form.password !== form.confirm) {
          newErrors.confirm = 'Passwords do not match.'
        }
      }

      setErrors(newErrors)
    }, 300)

    return () => clearTimeout(timer)
  }, [form.name, form.email, form.password, form.confirm, touched])

  // Contextual loading messages for slow connections
  useEffect(() => {
    if (!loading) { setLoadingMsg(''); return }
    setLoadingMsg('Creating account…')
    const t1 = setTimeout(() => setLoadingMsg('Connecting to server…'), 3000)
    const t2 = setTimeout(() => setLoadingMsg('Server is waking up, please wait…'), 8000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (form.name.trim().length < 2) {
      setServerError('Please enter your full name.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setServerError('Please enter a valid email address.')
      return
    }
    if (form.password.length < 6) {
      setServerError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setServerError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      })
      login(res.data.token, res.data.user)
      navigate('/upload')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true)
    setServerError('')
    try {
      const res = await api.post('/api/auth/google', { idToken: response.credential })
      if (!res.data.token) {
        setServerError('Google login failed.')
        setLoading(false)
        return
      }
      login(res.data.token, res.data.user)
      navigate('/upload')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Google authentication failed.')
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

        const containerWidth = Math.min(container.offsetWidth, 400)
        container.innerHTML = ''
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

    const resizeObserver = new ResizeObserver(() => {
      if (googleReady && window.google) renderGoogleButton()
    })
    if (googleBtnRef.current) resizeObserver.observe(googleBtnRef.current)

    return () => {
      clearInterval(interval)
      resizeObserver.disconnect()
    }
  }, [handleGoogleResponse, googleReady])

  const isNameValid = touched.name && form.name && !errors.name
  const isEmailValid = touched.email && form.email && !errors.email
  const isPasswordValid = touched.password && form.password && !errors.password
  const isConfirmValid = touched.confirm && form.confirm && form.confirm === form.password && !errors.confirm

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24">
      <div className="glass-card w-full max-w-md p-8 fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gold-text">ResuMind</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Create your free account</p>
        </div>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm overflow-hidden"
            >
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Sign-In */}
        <div className="w-full flex justify-center mb-6 min-h-[44px] relative" style={{ maxWidth: '100%' }}>
          {!googleReady && !googleFailed && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-slate-400 text-sm py-2">
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
            Google Sign-In is unavailable. Please sign up with email below.
          </div>
        )}

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }}></div>
          <span className="flex-shrink mx-4 text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>or sign up with email</span>
          <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Full name</label>
              {isNameValid && (
                <span className="text-xs text-emerald-600 font-medium">✓</span>
              )}
            </div>
            <input
              id="reg-name"
              type="text"
              required
              placeholder="Jane Doe"
              className={`input-field ${errors.name ? 'border-red-500/60 focus:border-red-500' : ''}`}
              value={form.name}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              onChange={e => {
                setForm(f => ({ ...f, name: e.target.value }))
                if (!touched.name) setTouched(t => ({ ...t, name: true }))
              }}
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-500 mt-1 pl-1"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email address</label>
              {isEmailValid && (
                <span className="text-xs text-emerald-600 font-medium">✓ Valid</span>
              )}
            </div>
            <input
              id="reg-email"
              type="email"
              required
              placeholder="you@example.com"
              className={`input-field ${errors.email ? 'border-red-500/60 focus:border-red-500' : ''}`}
              value={form.email}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              onChange={e => {
                setForm(f => ({ ...f, email: e.target.value }))
                if (!touched.email) setTouched(t => ({ ...t, email: true }))
              }}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-500 mt-1 pl-1"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Password</label>
              {isPasswordValid && (
                <span className="text-xs text-emerald-600 font-medium">✓ Valid length</span>
              )}
            </div>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min 6 characters"
                className={`input-field pr-12 ${errors.password ? 'border-red-500/60 focus:border-red-500' : ''}`}
                value={form.password}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                onChange={e => {
                  setForm(f => ({ ...f, password: e.target.value }))
                  if (!touched.password) setTouched(t => ({ ...t, password: true }))
                }}
              />
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
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-500 mt-1 pl-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
              {isConfirmValid && (
                <span className="text-xs text-emerald-600 font-medium">✓ Match</span>
              )}
            </div>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                className={`input-field pr-12 ${errors.confirm ? 'border-red-500/60 focus:border-red-500' : ''}`}
                value={form.confirm}
                onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                onChange={e => {
                  setForm(f => ({ ...f, confirm: e.target.value }))
                  if (!touched.confirm) setTouched(t => ({ ...t, confirm: true }))
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 focus:outline-none transition-colors p-1"
                style={{ color: 'var(--text-tertiary)' }}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? (
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
            <AnimatePresence>
              {errors.confirm && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-500 mt-1 pl-1"
                >
                  {errors.confirm}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            id="reg-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 mt-4 text-base tracking-wide shadow-md"
          >
            {loading ? loadingMsg : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium transition-colors hover:opacity-80" style={{ color: 'var(--violet-500)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
