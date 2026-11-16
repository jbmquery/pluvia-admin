// src/components/general/filterBlockComponent.jsx
// Bloque de filtros: campos + botones Limpiar / Buscar. Enter también busca.
import { Eraser, Search } from 'lucide-react'

export default function FilterBlock({ onSearch, onClear, searching = false, children }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
      className="rounded-3xl border border-white/10 bg-base-100 p-4 sm:p-5"
    >
      <h2 className="mb-4 text-base font-bold">Filtros</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-ghost" onClick={onClear} disabled={searching}>
          <Eraser className="size-4" />
          Limpiar
        </button>
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? <span className="loading loading-spinner loading-sm" /> : <Search className="size-4" />}
          Buscar
        </button>
      </div>
    </form>
  )
}
