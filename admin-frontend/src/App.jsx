// src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/general/toastComponent'
import { ProtectedRoute, PublicRoute } from './routes/guards'
import LoginPage from './pages/loginPage'
import RestaurarLoginPage from './pages/restaurarLoginPage'
import DashboardPage from './pages/dashboardPage'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/restaurar-password" element={<RestaurarLoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
