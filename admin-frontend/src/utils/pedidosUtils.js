// src/utils/pedidosUtils.js

export const ESTADOS_PEDIDO = ['completado', 'cancelado', 'inconcluso']
export const ESTADOS_DETALLE = ['pendiente', 'cancelado', 'perdida', 'pagado']
export const METODOS_PAGO = ['yape', 'efectivo', 'plin', 'transferencia', 'agora', 'bim']

export const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '')
export const toOptions = (list) => list.map((v) => ({ value: v, label: cap(v) }))

// Lista fija + los valores que existan en los datos y no estén en la lista (datos antiguos)
export const optionsFromData = (list, rows, key) => {
  const extra = [...new Set(rows.map((r) => r[key]).filter((v) => v && !list.includes(v)))]
  return [...toOptions(list), ...extra.map((v) => ({ value: v, label: v }))]
}
// Igual, pero para un registro concreto (modal de edición)
export const optionsWithCurrent = (list, current) =>
  current && !list.includes(current) ? [...toOptions(list), { value: current, label: `${current} (valor anterior)` }] : toOptions(list)

// "14:30:00-05:00" -> "14:30:00"  |  "2026-10-20T13:05:07.123456" -> "2026-10-20T13:05:07"
export const hms = (t) => (t ? String(t).slice(0, 8) : '')
export const dtLocal = (v) => (v ? String(v).slice(0, 19) : '')
// "14:30:00-05:00" -> "-05:00"   (vacío si la hora no trae zona horaria)
export const offsetOf = (t) => /([+-]\d{2}(?::?\d{2})?)$/.exec(String(t ?? ''))?.[1] ?? ''

// "2026-10-20T13:05:07" -> "20/10/2026 13:05"
export const formatDateTimeStr = (v) => {
  if (!v) return '—'
  const s = String(v)
  const [y, m, d] = s.slice(0, 10).split('-')
  return `${d}/${m}/${y} ${s.slice(11, 16)}`
}

// ---------- Semana del mes: bloques de 7 días (1–7, 8–14, 15–21, 22–28, 29–fin) ----------
const diasDelMes = (anio, mes) => new Date(anio, mes, 0).getDate()
const dd = (n) => String(n).padStart(2, '0')

export function semanaOptions(meses, anios) {
  let max = 4
  if (meses.length === 0 || anios.length === 0) max = 5
  else meses.forEach((m) => anios.forEach((a) => (max = Math.max(max, Math.ceil(diasDelMes(Number(a), Number(m)) / 7)))))
  const unico = meses.length === 1 && anios.length === 1
  return Array.from({ length: max }, (_, i) => {
    const w = i + 1
    if (!unico) return { value: String(w), label: `Semana ${w}` }
    const fin = Math.min(w * 7, diasDelMes(Number(anios[0]), Number(meses[0])))
    return { value: String(w), label: `Semana ${w} (${dd((w - 1) * 7 + 1)}–${dd(fin)})` }
  })
}

export const defaultsPeriodo = (mes, anio, extra = {}) => ({ meses: [String(mes)], anios: [String(anio)], ...extra })
