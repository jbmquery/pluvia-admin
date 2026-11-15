// src/components/general/estadoBadgeComponent.jsx
export default function EstadoBadge({ value }) {
  return (
    <span className={`badge badge-soft ${value ? 'badge-success' : 'badge-error'}`}>
      {value ? 'Activo' : 'Inactivo'}
    </span>
  )
}
