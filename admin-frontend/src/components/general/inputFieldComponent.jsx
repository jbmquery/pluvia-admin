// src/components/general/inputFieldComponent.jsx
// Campo reutilizable. Si type="password" agrega el botón del "ojito".
import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function InputField({ label, icon: Icon, type = 'text', ...rest }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-base-content/80">
        {label}
      </label>
      <div className="input h-12 w-full border-white/10 bg-base-300/60 focus-within:border-primary focus-within:outline-primary">
        {Icon && <Icon className="size-5 shrink-0 opacity-60" aria-hidden="true" />}
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          className="grow text-base"
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
    </div>
  )
}
