// src/components/general/selectFieldComponent.jsx
// Fondo 100% opaco (también en la lista desplegable nativa).
// placeholder={null} elimina la opción vacía (útil para campos como Estado).
import { useId } from 'react'

export default function SelectField({ label, options, placeholder = 'Seleccionar…', ...rest }) {
  const id = useId()
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-base-content/80">
        {label}
      </label>
      <select
        id={id}
        className="select h-12 w-full border-white/10 bg-base-300 text-base [&>option]:bg-base-300 [&>option]:text-base-content"
        {...rest}
      >
        {placeholder !== null && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
