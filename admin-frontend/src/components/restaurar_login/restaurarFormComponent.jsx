// src/components/restaurar_login/restaurarFormComponent.jsx
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, KeyRound, Lock, Mail, X } from 'lucide-react'
import InputField from '../general/inputFieldComponent'

// Los mismos requisitos se validan de nuevo en el backend (la validación real está allá).
const buildRules = (nueva, actual, confirmacion) => [
  { id: 'len', label: 'Mínimo 8 caracteres', ok: nueva.length >= 8 },
  { id: 'upper', label: 'Una letra mayúscula', ok: /[A-Z]/.test(nueva) },
  { id: 'lower', label: 'Una letra minúscula', ok: /[a-z]/.test(nueva) },
  { id: 'num', label: 'Un número', ok: /\d/.test(nueva) },
  { id: 'sym', label: 'Un símbolo (por ejemplo ! @ # $)', ok: /[^A-Za-z0-9]/.test(nueva) },
  { id: 'diff', label: 'Distinta a la contraseña anterior', ok: nueva.length > 0 && nueva !== actual },
  { id: 'match', label: 'Coincide con la confirmación', ok: nueva.length > 0 && nueva === confirmacion },
]

export default function RestaurarForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ correo: '', actual: '', nueva: '', confirmacion: '' })

  const rules = useMemo(
    () => buildRules(form.nueva, form.actual, form.confirmacion),
    [form.nueva, form.actual, form.confirmacion],
  )
  const canSubmit = rules.every((r) => r.ok) && form.correo.trim() !== '' && form.actual !== ''

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canSubmit) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <InputField
        label="Correo"
        icon={Mail}
        type="email"
        name="correo"
        value={form.correo}
        onChange={handleChange}
        placeholder="tucorreo@empresa.com"
        autoComplete="username"
        disabled={loading}
      />
      <InputField
        label="Contraseña anterior"
        icon={Lock}
        type="password"
        name="actual"
        value={form.actual}
        onChange={handleChange}
        autoComplete="current-password"
        disabled={loading}
      />
      <InputField
        label="Nueva contraseña"
        icon={KeyRound}
        type="password"
        name="nueva"
        value={form.nueva}
        onChange={handleChange}
        autoComplete="new-password"
        maxLength={64}
        disabled={loading}
      />
      <InputField
        label="Confirmar contraseña"
        icon={KeyRound}
        type="password"
        name="confirmacion"
        value={form.confirmacion}
        onChange={handleChange}
        autoComplete="new-password"
        maxLength={64}
        disabled={loading}
      />

      <ul className="grid grid-cols-1 gap-1 rounded-2xl bg-base-300/50 p-3 text-xs sm:grid-cols-2" aria-label="Requisitos de la nueva contraseña">
        {rules.map((r) => (
          <li key={r.id} className={`flex items-center gap-2 ${r.ok ? 'text-success' : 'text-base-content/50'}`}>
            {r.ok ? <Check className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
            {r.label}
          </li>
        ))}
      </ul>

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="btn btn-lg w-full border-0 bg-linear-to-r from-amber-400 to-orange-600 text-lg font-bold text-white hover:brightness-110 disabled:bg-base-300 disabled:bg-none disabled:text-base-content/40"
      >
        {loading && <span className="loading loading-spinner" />}
        Actualizar
      </button>

      <p className="text-center text-sm">
        <Link to="/login" className="link link-primary">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  )
}
