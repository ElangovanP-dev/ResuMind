import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login    from './pages/Login'
import Register from './pages/Register'
import Upload   from './pages/Upload'
import Results  from './pages/Results'
import History  from './pages/History'
import PublicResults from './pages/PublicResults'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token')
  if (token) return <Navigate to="/upload" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/upload"   element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/history"  element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/public/results/:shareToken" element={<PublicResults />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
