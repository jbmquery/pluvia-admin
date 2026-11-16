// src/components/sedes_turnos/turnosTab.jsx
import { useMemo, useState } from 'react'
import { Pencil, Search } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import EstadoBadge from '../general/estadoBadgeComponent'
import ConfirmModal from '../general/confirmModalComponent'
import TurnoModal from './turnoModal'
import { formatTime, normalizeText } from '../../utils/formatUtils'
import { actualizarTurno, crearTurno, eliminarTurno } from '../../Apis/sedesTurnos/sedesTurnosApi'

const EMPTY = { q: '', sede: '', estado: '' }

const COLUMNS = [
  { key: 'id_turno', label: 'ID' },
  { key: 'nombre_sede', label: 'Sede' },
  { key: 'nombre_turno', label: 'Turno' },
  { key: 'hora_inicio', label: 'Inicio', render: (r) => formatTime(r.hora_inicio) },
  { key: 'hora_fin', label: 'Fin', render: (r) => formatTime(r.hora_fin) },
  {
    key: 'tolerancia_minutos',
    label: 'Tolerancia',
    render: (r) => (r.tolerancia_minutos === null || r.tolerancia_minutos === undefined ? '—' : `${r.tolerancia_minutos} min`),
  },
  { key: 'estado', label: 'Estado', render: (r) => <EstadoBadge value={r.estado} /> },
]

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

export default function TurnosTab({ turnos, sedes, onChanged }) {
  const toast = useToast()

  const [draft, setDraft] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = normalizeText(applied.q)
    return turnos.filter((t) => {
      if (q && !normalizeText(t.nombre_turno).includes(q)) return false
      if (applied.sede !== '' && String(t.id_sede) !== applied.sede) return false
      if (applied.estado !== '' && String(t.estado) !== applied.estado) return false
      return true
    })
  }, [turnos, applied])

  const sedeOptions = useMemo(
    () =>
      sedes.map((s) => ({
        value: String(s.id_sede),
        label: s.estado === false ? `${s.nombre_sede} (inactiva)` : s.nombre_sede,
      })),
    [sedes],
  )

  const handleChange = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))
  const handleClear = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const row = drawer.row
      const res = row ? await actualizarTurno(row.id_turno, payload) : await crearTurno(payload)
      toast.success(res.message)
      setDrawer({ open: false, row: null })
      await onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const runDelete = async () => {
    setBusy(true)
    try {
      const res = await eliminarTurno(confirm.id_turno)
      toast.success(res.message)
      setDrawer({ open: false, row: null })
      setConfirm(null)
      await onChanged()
    } catch (err) {
      toast.error(err.message)
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FilterBlock onSearch={() => setApplied(draft)} onClear={handleClear}>
        <InputField label="Buscar" icon={Search} name="q" value={draft.q} onChange={handleChange} placeholder="Nombre del turno" />
        <SelectField label="Sede" name="sede" value={draft.sede} onChange={handleChange} options={sedeOptions} placeholder="Todas" />
        <SelectField label="Estado" name="estado" value={draft.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder="Todos" />
      </FilterBlock>

      <DataTable
        columns={COLUMNS}
        rows={filtered}
        rowKey="id_turno"
        resetKey={applied}
        onAdd={() => setDrawer({ open: true, row: null })}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm"
              title="Editar"
              aria-label="Editar"
              onClick={() => setDrawer({ open: true, row })}
            >
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <TurnoModal
        open={drawer.open}
        row={drawer.row}
        sedeOptions={sedeOptions}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm(drawer.row)}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Eliminar turno"
        message={`¿Seguro que deseas eliminar el turno «${confirm?.nombre_turno}» de ${confirm?.nombre_sede}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
