import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

/** Helper to decode JWT payload safely */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  // Optimistic synchronous session initialization eliminates initial loading spinners & layout shifts
  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) return null
      const payload = parseJwt(storedToken)
      // If token is already expired according to payload exp claim, purge immediately
      if (payload?.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return null
      }
      return storedToken
    } catch {
      return null
    }
  })

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user')
      return storedUser ? JSON.parse(storedUser) : null
    } catch {
      return null
    }
  })

  const [isValidating, setIsValidating] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem('token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }, [])

  // Background token verification without blocking UI
  useEffect(() => {
    if (!token) return

    const payload = parseJwt(token)
    if (payload?.exp) {
      const timeLeftMs = payload.exp * 1000 - Date.now()
      // If less than 60 seconds left, token has essentially expired
      if (timeLeftMs <= 60000) {
        logout()
        return
      }
    }

    // Silent background ping to verify backend connectivity and session validity
    setIsValidating(true)
    api.get('/api/auth/ping', { timeout: 10000 })
      .catch((err) => {
        if (err.response?.status === 401) {
          logout()
        }
      })
      .finally(() => {
        setIsValidating(false)
      })
  }, [token, logout])

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue)
      } else if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isValidating }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
