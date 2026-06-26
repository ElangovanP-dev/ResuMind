import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name, email: form.email, password: form.password
      })
      login(res.data.token, res.data.user)
      navigate('/upload')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
          <p className="text-slate-600 mt-1 text-sm">Create your free account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-1.5">Full name</label>
            <input id="reg-name" type="text" required placeholder="John Doe"
              className="input-field"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-600 text-sm mb-1.5">Email address</label>
            <input id="reg-email" type="email" required placeholder="you@example.com"
              className="input-field"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-600 text-sm mb-1.5">Password</label>
            <input id="reg-password" type="password" required placeholder="Min 6 characters"
              className="input-field"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-600 text-sm mb-1.5">Confirm password</label>
            <input id="reg-confirm" type="password" required placeholder="Repeat password"
              className="input-field"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} />
          </div>
          <button id="reg-submit" type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
