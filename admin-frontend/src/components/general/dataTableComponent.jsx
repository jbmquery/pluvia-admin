// src/components/general/dataTableComponent.jsx
// Bloque de resultados: selector de columnas, botón Añadir, tabla con columna Acción y paginación local.
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Columns3, Plus } from 'lucide-react'

const PAGE_SIZES = [10, 25, 50]

export default function DataTable({
  title = 'Resultados',
  columns,
  defaultVisible,
  rows,
  rowKey,
  renderActions,
  onAdd,
  addLabel = 'Añadir',
  emptyText = 'No se encontraron resultados.',
  resetKey, // al cambiar (nuevo filtro aplicado) vuelve a la página 1
}) {
  const [visible, setVisible] = useState(() => new Set(defaultVisible ?? columns.map((c) => c.key)))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)
  const shownCols = columns.filter((c) => visible.has(c.key))

  const toggle = (key) =>
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key) // siempre queda al menos una columna
      } else {
        next.add(key)
      }
      return next
    })

  return (
    <section className="rounded-3xl border border-white/10 bg-base-100 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-base font-bold">
          {title} <span className="font-normal text-base-content/60">({rows.length})</span>
        </h2>

        <div className="ml-auto flex items-center gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost border-white/10">
              <Columns3 className="size-4" />
              <span className="hidden sm:inline">Columnas</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-20 mt-2 max-h-72 w-60 overflow-y-auto rounded-2xl border border-white/10 bg-base-100 p-2 shadow-xl"
            >
              {columns.map((c) => (
                <li key={c.key}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-base-300/60">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={visible.has(c.key)}
                      onChange={() => toggle(c.key)}
                    />
                    <span className="text-sm">{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {onAdd && (
            <button type="button" className="btn btn-primary" onClick={onAdd}>
              <Plus className="size-4" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="table">
          <thead>
            <tr>
              {shownCols.map((c) => (
                <th key={c.key} className="whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              {renderActions && <th className="sticky right-0 bg-base-100 text-right">Acción</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={shownCols.length + (renderActions ? 1 : 0)} className="py-10 text-center text-base-content/60">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row[rowKey]} className="hover:bg-base-300/40">
                  {shownCols.map((c) => {
                    const raw = row[c.key]
                    return (
                      <td key={c.key} className="whitespace-nowrap">
                        {c.render ? c.render(row) : raw === null || raw === undefined || raw === '' ? '—' : raw}
                      </td>
                    )
                  })}
                  {renderActions && <td className="sticky right-0 bg-base-100">{renderActions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-between">
        <p className="text-base-content/60">
          {rows.length === 0 ? 'Sin registros' : `Mostrando ${start + 1}–${Math.min(start + pageSize, rows.length)} de ${rows.length}`}
        </p>
        <div className="flex items-center gap-3">
          <select
            className="select select-sm w-auto border-white/10 bg-base-300/60"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            aria-label="Filas por página"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
          <div className="join">
            <button
              type="button"
              className="btn btn-sm join-item"
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="btn btn-sm join-item pointer-events-none">
              {current} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm join-item"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
