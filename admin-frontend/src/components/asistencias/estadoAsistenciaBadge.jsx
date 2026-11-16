// src/components/asistencias/estadoAsistenciaBadge.jsx
import { ESTADO_LABEL } from '../../utils/asistenciasUtils'

const CLASES = {
  puntual: 'badge-success',
  tarde: 'badge-warning',
  falta: 'badge-error',
  justificado: 'badge-info',
  vacaciones: 'badge-accent',
  'licencia con goce': 'badge-secondary',
  'licencia sin goce': 'badge-neutral',
}

export default function EstadoAsistenciaBadge({ value }) {
  return <span className={`badge badge-soft whitespace-nowrap ${CLASES[value] ?? ''}`}>{ESTADO_LABEL[value] ?? value}</span>
}
