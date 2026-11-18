// src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/general/toastComponent'
import { ProtectedRoute, PublicRoute } from './routes/guards'
import LoginPage from './pages/loginPage'
import RestaurarLoginPage from './pages/restaurarLoginPage'
import DashboardPage from './pages/dashboardPage'
import UsuariosPage from './pages/usuariosPage'
import SedesTurnosPage from './pages/sedesTurnosPage'
import AsistenciasPage from './pages/asistenciasPage'
import CartaPage from './pages/cartaPage'

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
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/sedes-turnos" element={<SedesTurnosPage />} />
            <Route path="/asistencias" element={<AsistenciasPage />} />
            <Route path="/carta" element={<CartaPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
