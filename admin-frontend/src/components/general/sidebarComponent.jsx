// src/components/general/sidebarComponent.jsx
// Desktop (lg+): barra fija a la izquierda. Mobile/tablet: panel deslizable con fondo oscuro.
import { NavLink } from 'react-router-dom'
import { Building2, CalendarCheck, LayoutDashboard, Users, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
  { to: '/sedes-turnos', label: 'Sedes y turnos', icon: Building2 },
  { to: '/asistencias', label: 'Asistencias', icon: CalendarCheck },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-white/10 bg-base-100 transition-transform duration-200 lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100dvh-4rem)] lg:translate-x-0 lg:self-start ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú principal"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 lg:hidden">
          <p className="min-w-0 truncate text-sm">
            Bienvenido, <span className="font-bold">{user?.apodo}</span>
          </p>
          <button type="button" className="btn btn-ghost btn-circle btn-sm" onClick={onClose} aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>

        <nav>
          <ul className="menu w-full gap-1 p-3">
            {ITEMS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} onClick={onClose} className={({ isActive }) => (isActive ? 'menu-active' : '')}>
                  <Icon className="size-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
