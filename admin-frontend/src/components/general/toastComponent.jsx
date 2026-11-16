// src/components/general/toastComponent.jsx
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'

const ToastContext = createContext(null)

const ALERT_CLASS = {
  error: 'alert-error',
  success: 'alert-success',
  info: 'alert-info',
  warning: 'alert-warning',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback(
    (message, type = 'info', duration = 4500) => {
      const id = ++idRef.current
      setToasts((t) => [...t, { id, message, type }])
      setTimeout(() => remove(id), duration)
    },
    [remove],
  )

  const api = useMemo(
    () => ({
      show,
      error: (m) => show(m, 'error'),
      success: (m) => show(m, 'success'),
      info: (m) => show(m, 'info'),
      warning: (m) => show(m, 'warning'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="toast toast-top toast-center z-[1100] max-w-[92vw] sm:max-w-md"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${ALERT_CLASS[t.type]} shadow-lg`}>
            <span className="text-sm font-medium">{t.message}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => remove(t.id)}
              aria-label="Cerrar notificación"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
