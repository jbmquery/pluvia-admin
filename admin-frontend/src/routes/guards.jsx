// src/routes/guards.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-base-200">
      <span className="loading loading-spinner loading-lg text-primary" aria-label="Cargando" />
    </div>
  )
}

// Solo usuarios con sesión
export function ProtectedRoute() {
  const { user, checking } = useAuth()
  const location = useLocation()
  if (checking) return <FullScreenLoader />
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

// Solo usuarios sin sesión (login, restaurar contraseña)
export function PublicRoute() {
  const { user, checking } = useAuth()
  if (checking) return <FullScreenLoader />
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
