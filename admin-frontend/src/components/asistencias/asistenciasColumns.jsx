// src/components/asistencias/asistenciasColumns.jsx
// Una sola definición de columnas para la tabla y para las descargas:
//   render -> lo que se ve en pantalla | text -> valor que va a Excel / PDF
import { formatDate, formatTime } from '../../utils/formatUtils'
import { ESTADO_LABEL, weekdayName } from '../../utils/asistenciasUtils'
import EstadoAsistenciaBadge from './estadoAsistenciaBadge'

const hora = (v) => (v ? formatTime(v) : '')
const num = (v) => (v === null || v === undefined ? '' : v)

export const COLUMNS = [
  { key: 'id_asistencia', label: 'ID', text: (r) => r.id_asistencia },
  { key: 'nombres_completos', label: 'Usuario', text: (r) => r.nombres_completos },
  { key: 'apodo', label: 'Apodo', text: (r) => r.apodo },
  { key: 'nombre_sede', label: 'Sede', text: (r) => r.nombre_sede },
  { key: 'nombre_turno', label: 'Turno', text: (r) => r.nombre_turno },
  { key: 'fecha', label: 'Fecha', render: (r) => formatDate(r.fecha), text: (r) => formatDate(r.fecha) },
  { key: 'dia', label: 'Día', render: (r) => weekdayName(r.fecha), text: (r) => weekdayName(r.fecha) },
  { key: 'hora_entrada_horario', label: 'Entrada (horario)', render: (r) => formatTime(r.hora_entrada_horario), text: (r) => hora(r.hora_entrada_horario) },
  { key: 'hora_salida_horario', label: 'Salida (horario)', render: (r) => formatTime(r.hora_salida_horario), text: (r) => hora(r.hora_salida_horario) },
  { key: 'hora_entrada_real', label: 'Entrada real', render: (r) => formatTime(r.hora_entrada_real), text: (r) => hora(r.hora_entrada_real) },
  { key: 'hora_salida_real', label: 'Salida real', render: (r) => formatTime(r.hora_salida_real), text: (r) => hora(r.hora_salida_real) },
  {
    key: 'estado_asistencia',
    label: 'Estado',
    render: (r) => <EstadoAsistenciaBadge value={r.estado_asistencia} />,
    text: (r) => ESTADO_LABEL[r.estado_asistencia] ?? r.estado_asistencia,
  },
  {
    key: 'minutos_tardanza',
    label: 'Min. tardanza',
    render: (r) =>
      r.minutos_tardanza === null ? '—' : <span className={r.minutos_tardanza > 0 ? 'font-semibold text-warning' : ''}>{r.minutos_tardanza}</span>,
    text: (r) => num(r.minutos_tardanza),
  },
  {
    key: 'minutos_extras',
    label: 'Min. extras',
    render: (r) =>
      r.minutos_extras === null ? '—' : <span className={r.minutos_extras > 0 ? 'font-semibold text-success' : ''}>{r.minutos_extras}</span>,
    text: (r) => num(r.minutos_extras),
  },
  {
    key: 'observacion',
    label: 'Observación',
    render: (r) =>
      r.observacion ? (
        <span className="block max-w-xs truncate" title={r.observacion}>
          {r.observacion}
        </span>
      ) : (
        '—'
      ),
    text: (r) => r.observacion ?? '',
  },
]

export const DEFAULT_VISIBLE = [
  'nombres_completos', 'nombre_sede', 'nombre_turno', 'fecha', 'hora_entrada_real', 'hora_salida_real',
  'estado_asistencia', 'minutos_tardanza', 'minutos_extras', 'observacion',
]
