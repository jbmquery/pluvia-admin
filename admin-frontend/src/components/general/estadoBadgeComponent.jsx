// src/components/general/estadoBadgeComponent.jsx
// value = true -> Activo | false -> Inactivo | null/undefined -> "—" (columna estado sin definir en la BD)
export default function EstadoBadge({ value }) {
  if (value === null || value === undefined) return <span className="text-base-content/50">—</span>
  return (
    <span className={`badge badge-soft ${value ? 'badge-success' : 'badge-error'}`}>
      {value ? 'Activo' : 'Inactivo'}
    </span>
  )
}
