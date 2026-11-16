// src/utils/formatUtils.js

// "2025-03-09" -> "09/03/2025" (sin pasar por Date para evitar desfases de zona horaria)
export const formatDate = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// "14:30:00" -> "14:30"
export const formatTime = (t) => (t ? String(t).slice(0, 5) : '—')

export const formatMoney = (n) =>
  n === null || n === undefined
    ? '—'
    : new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)

// Minúsculas y sin tildes, para búsquedas locales
export const normalizeText = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
