// src/components/sedes_turnos/sedesTab.jsx
import { useMemo, useState } from 'react'
import { Pencil, Search } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import EstadoBadge from '../general/estadoBadgeComponent'
import ConfirmModal from '../general/confirmModalComponent'
import SedeModal from './sedeModal'
import { formatDate, normalizeText } from '../../utils/formatUtils'
import { actualizarSede, crearSede, eliminarSede } from '../../Apis/sedesTurnos/sedesTurnosApi'

const EMPTY = { q: '', tipo: '', estado: '' }

const COLUMNS = [
  { key: 'id_sede', label: 'ID' },
  { key: 'nombre_sede', label: 'Sede' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'tipo_sede', label: 'Tipo' },
  { key: 'capacidad', label: 'Capacidad' },
  { key: 'estado', label: 'Estado', render: (r) => <EstadoBadge value={r.estado} /> },
  { key: 'n_turnos', label: 'Turnos' },
  { key: 'n_empleados', label: 'Empleados' },
  { key: 'latitud', label: 'Latitud' },
  { key: 'longitud', label: 'Longitud' },
  { key: 'fecha_creacion', label: 'Creación', render: (r) => formatDate(r.fecha_creacion) },
]
const DEFAULT_VISIBLE = ['id_sede', 'nombre_sede', 'direccion', 'tipo_sede', 'capacidad', 'estado']

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

export default function SedesTab({ sedes, onChanged }) {
  const toast = useToast()

  const [draft, setDraft] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  // Filtrado local: no consulta la base de datos
  const filtered = useMemo(() => {
    const q = normalizeText(applied.q)
    return sedes.filter((s) => {
      if (q && !normalizeText(s.nombre_sede).includes(q) && !normalizeText(s.direccion).includes(q)) return false
      if (applied.tipo !== '' && s.tipo_sede !== applied.tipo) return false
      if (applied.estado !== '' && String(s.estado) !== applied.estado) return false
      return true
    })
  }, [sedes, applied])

  // Tipos de sede que existen en los datos
  const tipoOptions = useMemo(
    () =>
      [...new Set(sedes.map((s) => s.tipo_sede).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map((t) => ({ value: t, label: t })),
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
      const res = row ? await actualizarSede(row.id_sede, payload) : await crearSede(payload)
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
      const res = await eliminarSede(confirm.id_sede)
      toast.success(res.message)
      setDrawer({ open: false, row: null })
      setConfirm(null)
      await onChanged()
    } catch (err) {
      toast.error(err.message) // incluye el motivo (p. ej. "tiene 2 turno(s) asociado(s)")
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FilterBlock onSearch={() => setApplied(draft)} onClear={handleClear}>
        <InputField label="Buscar" icon={Search} name="q" value={draft.q} onChange={handleChange} placeholder="Nombre o dirección" />
        <SelectField label="Tipo de sede" name="tipo" value={draft.tipo} onChange={handleChange} options={tipoOptions} placeholder="Todos" />
        <SelectField label="Estado" name="estado" value={draft.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder="Todos" />
      </FilterBlock>

      <DataTable
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        rows={filtered}
        rowKey="id_sede"
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

      <SedeModal
        open={drawer.open}
        row={drawer.row}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm(drawer.row)}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Eliminar sede"
        message={`¿Seguro que deseas eliminar la sede «${confirm?.nombre_sede}»? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
