import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000, // 120 seconds — accommodates cold start + deep AI processing
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if 401 Unauthorized occurs on protected routes (not during login/register/ping)
    const isAuthRoute = error.config?.url?.includes('/api/auth/')
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Provide user-friendly timeout messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.isTimeout = true
      error.userMessage = 'The server is taking too long to respond. It may be waking up from sleep — please try again.'
    }

    if (!error.response && !error.isTimeout) {
      error.isNetworkError = true
      error.userMessage = 'Unable to reach the server. Please check your internet connection and try again.'
    }

    return Promise.reject(error)
  }
)

export default api
