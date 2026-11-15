// src/components/usuarios/empleadosTab.jsx
import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import SelectField from '../general/selectFieldComponent'
import EstadoBadge from '../general/estadoBadgeComponent'
import ConfirmModal from '../general/confirmModalComponent'
import EmpleadoModal from './empleadoModal'
import { formatDate, formatMoney } from '../../utils/formatUtils'
import { actualizarEmpleado, crearEmpleado, eliminarEmpleado } from '../../Apis/usuarios/usuariosApi'

const EMPTY = { usuario: '', sede: '', estado: '' }

const COLUMNS = [
  { key: 'id_empleado', label: 'ID' },
  { key: 'nombres_completos', label: 'Empleado' },
  { key: 'nombre_sede', label: 'Sede' },
  { key: 'nivel_nombre', label: 'Nivel' },
  { key: 'sueldo', label: 'Sueldo', render: (r) => formatMoney(r.sueldo) },
  { key: 'tipo_contrato', label: 'Contrato' },
  { key: 'fecha_inicio', label: 'Inicio', render: (r) => formatDate(r.fecha_inicio) },
  { key: 'fecha_fin', label: 'Fin', render: (r) => formatDate(r.fecha_fin) },
  { key: 'estado', label: 'Estado', render: (r) => <EstadoBadge value={r.estado} /> },
  { key: 'turno_referencia', label: 'Turno' },
  { key: 'observacion', label: 'Observación' },
]
const DEFAULT_VISIBLE = ['id_empleado', 'nombres_completos', 'nombre_sede', 'tipo_contrato', 'sueldo', 'fecha_inicio', 'estado']

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

export default function EmpleadosTab({ empleados, usuarios, sedes, niveles, onChanged }) {
  const toast = useToast()
  const { user: me } = useAuth()

  const [draft, setDraft] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(
    () =>
      empleados.filter((e) => {
        if (applied.usuario !== '' && String(e.id_usuario) !== applied.usuario) return false
        if (applied.sede !== '' && String(e.id_sede) !== applied.sede) return false
        if (applied.estado !== '' && String(e.estado) !== applied.estado) return false
        return true
      }),
    [empleados, applied],
  )

  // Filtro Usuario: usuarios que aparecen en empleados (nombre completo viene del INNER JOIN)
  const usuarioFilterOptions = useMemo(() => {
    const map = new Map()
    empleados.forEach((e) => map.set(e.id_usuario, e.nombres_completos))
    return [...map.entries()]
      .map(([value, label]) => ({ value: String(value), label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))
  }, [empleados])

  const sedeOptions = useMemo(() => sedes.map((s) => ({ value: String(s.id_sede), label: s.nombre_sede })), [sedes])

  const usuarioFormOptions = useMemo(
    () =>
      usuarios
        .filter((u) => u.tipo_usuario <= me.tipo_usuario)
        .map((u) => ({ value: String(u.id_usuario), label: `${u.nombres_completos} (${u.apodo})` })),
    [usuarios, me.tipo_usuario],
  )
  const nivelFormOptions = useMemo(
    () =>
      niveles
        .filter((n) => n.id_tipo_usuario <= me.tipo_usuario)
        .map((n) => ({ value: String(n.id_tipo_usuario), label: `${n.nombre} (${n.id_tipo_usuario})` })),
    [niveles, me.tipo_usuario],
  )

  const levelOf = (empleado) => usuarios.find((u) => u.id_usuario === empleado.id_usuario)?.tipo_usuario ?? 0
  const canManage = (row) => levelOf(row) <= me.tipo_usuario

  const handleChange = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))
  const handleClear = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const row = drawer.row
      const res = row ? await actualizarEmpleado(row.id_empleado, payload) : await crearEmpleado(payload)
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
      const res = await eliminarEmpleado(confirm.id_empleado)
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

  const editing = drawer.row

  return (
    <div className="space-y-4">
      <FilterBlock onSearch={() => setApplied(draft)} onClear={handleClear}>
        <SelectField label="Usuario" name="usuario" value={draft.usuario} onChange={handleChange} options={usuarioFilterOptions} placeholder="Todos" />
        <SelectField label="Sede" name="sede" value={draft.sede} onChange={handleChange} options={sedeOptions} placeholder="Todas" />
        <SelectField label="Estado" name="estado" value={draft.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder="Todos" />
      </FilterBlock>

      <DataTable
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        rows={filtered}
        rowKey="id_empleado"
        resetKey={applied}
        onAdd={() => setDrawer({ open: true, row: null })}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm"
              title={canManage(row) ? 'Editar' : 'Usuario de nivel superior al tuyo'}
              aria-label="Editar"
              disabled={!canManage(row)}
              onClick={() => setDrawer({ open: true, row })}
            >
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <EmpleadoModal
        open={drawer.open}
        row={editing}
        usuarioOptions={usuarioFormOptions}
        sedeOptions={sedeOptions}
        nivelOptions={nivelFormOptions}
        canDelete={Boolean(editing)}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm(editing)}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Eliminar empleado"
        message={`¿Seguro que deseas eliminar el registro de empleado de ${confirm?.nombres_completos}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
