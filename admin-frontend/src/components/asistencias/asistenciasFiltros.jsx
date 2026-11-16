// src/components/asistencias/asistenciasFiltros.jsx
import { useMemo } from 'react'
import FilterBlock from '../general/filterBlockComponent'
import MultiSelectField from '../general/multiSelectFieldComponent'
import { ESTADOS, MESES } from '../../utils/asistenciasUtils'

const MES_OPTIONS = MESES.map((m, i) => ({ value: String(i + 1), label: m }))
const ESTADO_OPTIONS = ESTADOS

export default function AsistenciasFiltros({ draft, setDraft, meta, onSearch, onClear, searching }) {
  const anioOptions = useMemo(() => meta.anios.map((a) => ({ value: String(a), label: String(a) })), [meta.anios])
  const usuarioOptions = useMemo(
    () => meta.usuarios.map((u) => ({ value: String(u.id_usuario), label: `${u.nombres_completos} (${u.apodo})` })),
    [meta.usuarios],
  )
  const sedeOptions = useMemo(() => meta.sedes.map((s) => ({ value: String(s.id_sede), label: s.nombre_sede })), [meta.sedes])

  // Si hay sedes elegidas, solo se ofrecen los turnos de esas sedes
  const turnoOptions = useMemo(
    () =>
      meta.turnos
        .filter((t) => draft.sedes.length === 0 || draft.sedes.includes(String(t.id_sede)))
        .map((t) => ({ value: String(t.id_turno), label: `${t.nombre_turno} · ${t.nombre_sede}` })),
    [meta.turnos, draft.sedes],
  )

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))

  const setSedes = (sedes) =>
    setDraft((d) => {
      const permitidos = new Set(
        meta.turnos.filter((t) => sedes.length === 0 || sedes.includes(String(t.id_sede))).map((t) => String(t.id_turno)),
      )
      return { ...d, sedes, turnos: d.turnos.filter((t) => permitidos.has(t)) }
    })

  return (
    <FilterBlock onSearch={onSearch} onClear={onClear} searching={searching}>
      <MultiSelectField label="Mes" options={MES_OPTIONS} value={draft.meses} onChange={set('meses')} placeholder="Seleccionar mes" />
      <MultiSelectField label="Año" options={anioOptions} value={draft.anios} onChange={set('anios')} placeholder="Seleccionar año" />
      <MultiSelectField label="Usuario" options={usuarioOptions} value={draft.usuarios} onChange={set('usuarios')} />
      <MultiSelectField label="Sede" options={sedeOptions} value={draft.sedes} onChange={setSedes} />
      <MultiSelectField label="Turno" options={turnoOptions} value={draft.turnos} onChange={set('turnos')} />
      <MultiSelectField label="Estado" options={ESTADO_OPTIONS} value={draft.estados} onChange={set('estados')} />
    </FilterBlock>
  )
}
