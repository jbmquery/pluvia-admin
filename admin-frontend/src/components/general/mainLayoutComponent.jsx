// src/components/general/mainLayoutComponent.jsx
// Estructura de las páginas internas: header arriba, sidebar a la izquierda, footer abajo.
import { useState } from 'react'
import Header from './headerComponent'
import Sidebar from './sidebarComponent'
import Footer from './footerComponent'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-base-200">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
