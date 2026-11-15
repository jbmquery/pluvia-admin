// src/components/general/sideDrawerComponent.jsx
// Modal pegado al lado derecho. En mobile ocupa todo el ancho.
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function SideDrawer({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/10 bg-base-100 shadow-2xl sm:w-[28rem]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" className="btn btn-ghost btn-circle btn-sm" onClick={onClose} aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <footer className="shrink-0 border-t border-white/10 p-4">{footer}</footer>}
      </aside>
    </div>
  )
}
