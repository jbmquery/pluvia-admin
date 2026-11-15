// src/components/general/selectFieldComponent.jsx
import { useId } from 'react'

export default function SelectField({ label, options, placeholder = 'Seleccionar…', ...rest }) {
  const id = useId()
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-base-content/80">
        {label}
      </label>
      <select id={id} className="select h-12 w-full border-white/10 bg-base-300/60 text-base" {...rest}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
