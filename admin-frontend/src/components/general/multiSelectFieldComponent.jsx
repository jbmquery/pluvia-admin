// src/components/general/multiSelectFieldComponent.jsx
// Selección múltiple con buscador. Fondo 100% opaco.
import { useId, useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { normalizeText } from '../../utils/formatUtils'

export default function MultiSelectField({ label, options, value, onChange, placeholder = 'Todos' }) {
  const id = useId()
  const [query, setQuery] = useState('')
  const selected = useMemo(() => new Set(value), [value])

  const visible = useMemo(() => {
    const q = normalizeText(query)
    return q ? options.filter((o) => normalizeText(o.label).includes(q)) : options
  }, [options, query])

  const emit = (set) => onChange(options.map((o) => o.value).filter((v) => set.has(v)))

  const toggle = (v) => {
    const next = new Set(selected)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    emit(next)
  }
  const selectVisible = () => emit(new Set([...selected, ...visible.map((o) => o.value)]))

  const chosen = options.filter((o) => selected.has(o.value))
  const summary =
    chosen.length === 0 ? placeholder : chosen.length <= 2 ? chosen.map((o) => o.label).join(', ') : `${chosen.length} seleccionados`

  return (
    <div className="w-full">
      <span id={id} className="mb-1.5 block text-sm font-medium text-base-content/80">
        {label}
      </span>
      <div className="dropdown w-full">
        <div
          tabIndex={0}
          role="button"
          aria-labelledby={id}
          aria-haspopup="listbox"
          className="flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-field border border-white/10 bg-base-300 px-4 text-base"
        >
          <span className={`truncate ${chosen.length === 0 ? 'text-base-content/60' : ''}`}>{summary}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
        </div>

        <div
          tabIndex={0}
          className="dropdown-content z-30 mt-2 w-full min-w-64 rounded-2xl border border-white/10 bg-base-300 p-2 opacity-100 shadow-2xl"
        >
          {options.length > 6 && (
            <label className="input input-sm mb-2 w-full border-white/10 bg-base-100">
              <Search className="size-4 opacity-60" aria-hidden="true" />
              <input
                type="text"
                className="grow"
                placeholder="Buscar…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                aria-label={`Buscar en ${label}`}
              />
            </label>
          )}
          <div className="mb-1 flex items-center justify-between px-2 text-xs">
            <button type="button" className="link link-primary" onClick={selectVisible}>
              Seleccionar todo
            </button>
            <button type="button" className="link link-primary" onClick={() => onChange([])}>
              Limpiar
            </button>
          </div>
          <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto">
            {visible.length === 0 && <li className="px-3 py-2 text-sm text-base-content/60">Sin resultados</li>}
            {visible.map((o) => (
              <li key={o.value}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-base-100">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={selected.has(o.value)}
                    onChange={() => toggle(o.value)}
                  />
                  <span className="text-sm">{o.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
