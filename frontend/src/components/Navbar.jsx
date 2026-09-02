import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onUploadClick }) {
  const { token, logout } = useAuth()
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0B0E]/90 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/40'
          : 'bg-[#0A0B0E]/60 backdrop-blur-sm border-b border-white/[0.04]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-3">

        {/* ── Brand Logo ── */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 p-[1px]">
            <div className="w-full h-full bg-[#0A0B0E] rounded-[11px] flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">Mind</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">AI</span>
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" current={location.pathname}>Home</NavLink>
          {token ? (
            <>
              <NavLink to="/upload" current={location.pathname}>Upload</NavLink>
              <NavLink to="/tailor" current={location.pathname}>JD Tailor</NavLink>
              <NavLink to="/ab-test" current={location.pathname}>A/B Test</NavLink>
              <NavLink to="/history" current={location.pathname}>History</NavLink>
            </>
          ) : isLanding ? (
            <>
              <a href="#demo-dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Bento Dashboard
              </a>
              <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Methodology
              </a>
              <a href="#faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                FAQ
              </a>
            </>
          ) : null}
        </div>

        {/* ── Right Action CTAs ── */}
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3">
              <Link
                to="/upload"
                className="hidden sm:inline-flex items-center gap-2 text-xs md:text-sm font-bold text-white px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all active:scale-[0.98]"
              >
                <span>✨</span> New Scan
              </Link>
              <button
                onClick={logout}
                className="text-xs md:text-sm font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs md:text-sm font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs md:text-sm font-bold text-white px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all active:scale-[0.98] border border-indigo-400/30"
              >
                Get Started Free
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white transition-all"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Responsive Mobile Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D0F14] border-t border-white/[0.08] px-5 py-5 space-y-3 shadow-2xl">
          <MobileLink to="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileLink>
          {token ? (
            <>
              <MobileLink to="/upload" onClick={() => setMobileMenuOpen(false)}>Upload Resume</MobileLink>
              <MobileLink to="/tailor" onClick={() => setMobileMenuOpen(false)}>Job Description Tailor</MobileLink>
              <MobileLink to="/ab-test" onClick={() => setMobileMenuOpen(false)}>A/B Version Test</MobileLink>
              <MobileLink to="/history" onClick={() => setMobileMenuOpen(false)}>Analysis History</MobileLink>
            </>
          ) : isLanding ? (
            <>
              <a
                href="#demo-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                Bento Dashboard
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                Methodology
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                FAQ
              </a>
            </>
          ) : null}

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {!token ? (
              <>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg"
                >
                  Analyze My Resume Free
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm text-slate-300 border border-white/10"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="w-full text-center py-2.5 rounded-xl text-sm text-rose-400 border border-rose-500/20"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ to, current, children }) {
  const isActive = current === to
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        isActive ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
    >
      {children}
    </Link>
  )
}
