import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { token, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold gold-text">ResuMind</span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div className="hidden md:flex items-center gap-7">
          {token ? (
            <>
              <NavLink to="/upload" current={location.pathname}>Upload</NavLink>
              <NavLink to="/tailor" current={location.pathname}>JD Tailor</NavLink>
              <NavLink to="/history" current={location.pathname}>History</NavLink>
            </>
          ) : isLanding ? (
            <>
              <a href="#features" className="nav-link-themed">Features</a>
              <a href="#how-it-works" className="nav-link-themed">How It Works</a>
              <a href="#faq" className="nav-link-themed">FAQ</a>
            </>
          ) : null}
        </div>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Auth Buttons */}
          {token ? (
            <button onClick={logout}
              className="text-sm font-semibold nav-link-themed hover:text-red-400 transition-colors px-3 py-2">
              Sign Out
            </button>
          ) : (
            <>
              <Link to="/login"
                className="hidden sm:block text-sm font-semibold nav-link-themed px-4 py-2 transition-colors">
                Sign In
              </Link>
              <Link to="/register"
                className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/25"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center theme-toggle-btn"
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

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-themed px-4 py-4 space-y-2 mobile-menu-bg">
          {token ? (
            <>
              <MobileLink to="/upload" onClick={() => setMobileMenuOpen(false)}>Upload Resume</MobileLink>
              <MobileLink to="/tailor" onClick={() => setMobileMenuOpen(false)}>JD Tailor</MobileLink>
              <MobileLink to="/history" onClick={() => setMobileMenuOpen(false)}>History</MobileLink>
            </>
          ) : isLanding ? (
            <>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-medium nav-link-themed hover:bg-violet-500/10">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-medium nav-link-themed hover:bg-violet-500/10">How It Works</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-medium nav-link-themed hover:bg-violet-500/10">FAQ</a>
            </>
          ) : null}
        </div>
      )}
    </nav>
  )
}

/* ── Helper Components ── */
function NavLink({ to, current, children }) {
  const isActive = current === to
  return (
    <Link to={to}
      className={`text-sm font-medium transition-colors ${
        isActive ? 'text-violet-500 font-semibold' : 'nav-link-themed hover:text-violet-400'
      }`}>
      {children}
    </Link>
  )
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick}
      className="block py-2 px-3 rounded-lg text-sm font-medium nav-link-themed hover:bg-violet-500/10 transition-colors">
      {children}
    </Link>
  )
}
