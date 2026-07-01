import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar   from './components/Navbar'
import Landing  from './pages/Landing'
import Login    from './pages/Login'
import Register from './pages/Register'
import Upload   from './pages/Upload'
import Results  from './pages/Results'
import History  from './pages/History'
import PublicResults from './pages/PublicResults'
import Tailor   from './pages/Tailor'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { token } = useAuth()
  if (token) return <Navigate to="/upload" replace />
  return children
}

function LandingRoute() {
  const { token } = useAuth()
  if (token) return <Navigate to="/upload" replace />
  return <Landing />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/upload"   element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/tailor"   element={<ProtectedRoute><Tailor /></ProtectedRoute>} />
        <Route path="/history"  element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/public/results/:shareToken" element={<PublicResults />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
