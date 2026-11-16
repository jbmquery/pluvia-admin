// src/utils/asistenciasUtils.js

export const ESTADOS = [
  { value: 'puntual', label: 'Puntual' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'falta', label: 'Falta' },
  { value: 'justificado', label: 'Justificado' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'licencia con goce', label: 'Licencia con goce' },
  { value: 'licencia sin goce', label: 'Licencia sin goce' },
]
export const ESTADO_LABEL = Object.fromEntries(ESTADOS.map((e) => [e.value, e.label]))

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// "2026-11-05" -> "Jueves" (sin pasar por zonas horarias)
export const weekdayName = (iso) => {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return DIAS[new Date(y, m - 1, d).getDay()]
}

export const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x))

// Filtros por defecto: mes y año de "hoy" (fecha del servidor)
export const defaultFilters = (mes, anio) => ({
  meses: [String(mes)],
  anios: [String(anio)],
  usuarios: [],
  sedes: [],
  turnos: [],
  estados: [],
})
