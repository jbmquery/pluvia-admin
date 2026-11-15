// src/components/general/headerComponent.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu } from 'lucide-react'
import logo from '../../img/logo_pluvia_blanco.webp'
import { useAuth } from '../../context/AuthContext'
import ConfirmModal from './confirmModalComponent'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      /* aunque falle la red, se limpia la sesión local */
    }
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-white/10 bg-base-100/90 px-3 backdrop-blur sm:px-6">
        <button
          type="button"
          className="btn btn-ghost btn-square lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu className="size-6" />
        </button>

        <Link to="/dashboard" className="shrink-0">
          <img src={logo} width={700} height={174} alt="Pluvia" className="h-8 w-auto sm:h-10" />
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-3">
          <p className="hidden min-w-0 truncate text-sm sm:block sm:text-base">
            Bienvenido, <span className="font-bold">{user?.apodo}</span>
          </p>
          <button type="button" className="btn btn-ghost btn-circle" aria-label="Notificaciones">
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-circle hover:text-error"
            onClick={() => setConfirmOpen(true)}
            aria-label="Salir"
            title="Salir"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <ConfirmModal
        open={confirmOpen}
        title="Cerrar sesión"
        message="¿Seguro que deseas salir del panel?"
        confirmText="Salir"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
