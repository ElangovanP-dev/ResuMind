import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
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
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pointer-events-none">
      <div
        className={`max-w-6xl mx-auto px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl sm:rounded-full transition-all duration-300 pointer-events-auto border flex items-center justify-between shadow-2xl ${
          scrolled
            ? 'bg-[#0E121E]/90 border-white/[0.12] backdrop-blur-2xl shadow-indigo-950/40'
            : 'bg-[#0B0E17]/75 border-white/[0.08] backdrop-blur-xl shadow-black/60'
        }`}
        style={{
          boxShadow: scrolled
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(99, 102, 241, 0.15)'
            : '0 15px 30px -10px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* ── Brand Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#08090D] rounded-[11px] flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white">
              Resu<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">Mind</span>
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 tracking-wider">
              2.0
            </span>
          </div>
        </Link>

        {/* ── Desktop Navigation Links ── */}
        <nav className="hidden md:flex items-center gap-7">
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
              <a href="#interactive-scanner" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                Live Scanner
              </a>
              <a href="#bento-metrics" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                5 Pillars
              </a>
              <a href="#features" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                Capabilities
              </a>
              <a href="#faq" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                FAQ
              </a>
            </>
          ) : null}
        </nav>

        {/* ── Right Action CTA Buttons ── */}
        <div className="flex items-center gap-2.5">
          {token ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl glow-btn-primary"
              >
                <span>✨</span> New Scan
              </Link>
              <button
                onClick={logout}
                className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl sm:rounded-full glow-btn-primary"
              >
                <span>✨</span> Scan Resume Free
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Dropdown ── */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 bg-[#0E121E]/95 border border-white/[0.12] rounded-2xl p-5 backdrop-blur-2xl shadow-2xl space-y-3 pointer-events-auto animate-in fade-in duration-200">
          <MobileLink to="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileLink>
          {token ? (
            <>
              <MobileLink to="/upload" onClick={() => setMobileMenuOpen(false)}>Upload Resume</MobileLink>
              <MobileLink to="/tailor" onClick={() => setMobileMenuOpen(false)}>Job Description Tailor</MobileLink>
              <MobileLink to="/ab-test" onClick={() => setMobileMenuOpen(false)}>A/B Version Test</MobileLink>
              <MobileLink to="/history" onClick={() => setMobileMenuOpen(false)}>History</MobileLink>
            </>
          ) : isLanding ? (
            <>
              <a
                href="#interactive-scanner"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
              >
                Live Scanner
              </a>
              <a
                href="#bento-metrics"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
              >
                5 Pillars
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
              >
                Capabilities
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
              >
                FAQ
              </a>
            </>
          ) : null}

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {!token ? (
              <>
                <Link
                  to="/upload"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-bold text-xs glow-btn-primary"
                >
                  Scan Resume Free
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-xl text-xs font-semibold text-slate-300 border border-white/10"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="w-full text-center py-2 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/20"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ to, current, children }) {
  const isActive = current === to
  return (
    <Link
      to={to}
      className={`text-xs font-semibold transition-colors ${
        isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
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
      className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
    >
      {children}
    </Link>
  )
}
