// src/components/pedidos_pagos/periodoFields.jsx
// Mes y Año (sin «Todos»: siempre debe haber al menos uno de cada uno) + Semana del mes opcional.
import { useMemo } from 'react'
import MultiSelectField from '../general/multiSelectFieldComponent'
import { MESES } from '../../utils/asistenciasUtils'
import { semanaOptions } from '../../utils/pedidosUtils'

const MES_OPTIONS = MESES.map((m, i) => ({ value: String(i + 1), label: m }))

export default function PeriodoFields({ draft, setDraft, anios, conSemana = true }) {
  const anioOptions = useMemo(() => anios.map((a) => ({ value: String(a), label: String(a) })), [anios])
  const semOptions = useMemo(() => semanaOptions(draft.meses, draft.anios), [draft.meses, draft.anios])
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <>
      <MultiSelectField label="Mes" options={MES_OPTIONS} value={draft.meses} onChange={set('meses')} placeholder="Seleccionar mes" />
      <MultiSelectField label="Año" options={anioOptions} value={draft.anios} onChange={set('anios')} placeholder="Seleccionar año" />
      {conSemana && (
        <MultiSelectField label="Semana del mes" options={semOptions} value={draft.semanas} onChange={set('semanas')} placeholder="Todas" />
      )}
    </>
  )
}
