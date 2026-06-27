import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const handleGoogleResponse = async (response) => {
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
  }

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "683526019565-dcrp41n0gupn2ocd35b1uafv6g0q6mhe.apps.googleusercontent.com",
          callback: handleGoogleResponse
        })
        window.google.accounts.id.renderButton(
          document.getElementById("google-button-div"),
          { theme: "outline", size: "large", width: "384", text: "continue_with" }
        )
      }
    }

    initializeGoogle()

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (script) {
      script.addEventListener('load', initializeGoogle)
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initializeGoogle)
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 fade-in-up">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
            <svg className="w-8 h-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text">ResuMind</h1>
          <p className="text-slate-600 mt-1 text-sm">AI-Powered Resume Analyzer</p>
        </div>

        <h2 className="text-xl font-semibold text-slate-900 mb-6">Welcome back</h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div id="google-button-div" className="w-full flex justify-center mb-6 min-h-[46px]"></div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider">or sign in with email</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-1.5">Email address</label>
            <input id="login-email" type="email" required placeholder="you@example.com"
              className="input-field"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-600 text-sm mb-1.5">Password</label>
            <div className="relative">
              <input id="login-password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                className="input-field pr-12"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
