// src/components/usuarios/usuariosTab.jsx
import { useMemo, useState } from 'react'
import { KeyRound, Pencil, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import EstadoBadge from '../general/estadoBadgeComponent'
import ConfirmModal from '../general/confirmModalComponent'
import UsuarioModal from './usuarioModal'
import { formatDate, normalizeText } from '../../utils/formatUtils'
import { actualizarUsuario, crearUsuario, eliminarUsuario, resetPasswordUsuario } from '../../Apis/usuarios/usuariosApi'

const DEFAULT_PASSWORD = '123456' // solo informativo; la define el backend

const EMPTY = { q: '', estado: '', tipo: '' }

const COLUMNS = [
  { key: 'id_usuario', label: 'ID' },
  { key: 'nombres_completos', label: 'Nombres completos' },
  { key: 'apodo', label: 'Apodo' },
  { key: 'correo', label: 'Correo' },
  { key: 'nivel_nombre', label: 'Nivel' },
  { key: 'estado', label: 'Estado', render: (r) => <EstadoBadge value={r.estado} /> },
  { key: 'celular', label: 'Celular' },
  { key: 'fecha_nacimiento', label: 'Nacimiento', render: (r) => formatDate(r.fecha_nacimiento) },
  { key: 'fecha_contratacion', label: 'Contratación', render: (r) => formatDate(r.fecha_contratacion) },
  { key: 'fecha_creacion', label: 'Creación', render: (r) => formatDate(r.fecha_creacion) },
]
const DEFAULT_VISIBLE = ['id_usuario', 'nombres_completos', 'apodo', 'correo', 'nivel_nombre', 'estado']

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

export default function UsuariosTab({ usuarios, niveles, onChanged }) {
  const toast = useToast()
  const { user: me } = useAuth()

  const [draft, setDraft] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'delete' | 'reset', row }
  const [busy, setBusy] = useState(false)

  // Filtrado local: no consulta la base de datos
  const filtered = useMemo(() => {
    const q = normalizeText(applied.q)
    return usuarios.filter((u) => {
      if (q && !normalizeText(u.nombres_completos).includes(q) && !normalizeText(u.apodo).includes(q)) return false
      if (applied.estado !== '' && String(u.estado) !== applied.estado) return false
      if (applied.tipo !== '' && String(u.tipo_usuario) !== applied.tipo) return false
      return true
    })
  }, [usuarios, applied])

  const nivelFilterOptions = useMemo(
    () => niveles.map((n) => ({ value: String(n.id_tipo_usuario), label: `${n.nombre} (${n.id_tipo_usuario})` })),
    [niveles],
  )
  const nivelFormOptions = useMemo(
    () =>
      niveles
        .filter((n) => n.id_tipo_usuario <= me.tipo_usuario)
        .map((n) => ({ value: String(n.id_tipo_usuario), label: `${n.nombre} (${n.id_tipo_usuario})` })),
    [niveles, me.tipo_usuario],
  )

  const canManage = (row) => row.tipo_usuario <= me.tipo_usuario
  const isSelf = (row) => row.id_usuario === me.id_usuario

  const handleChange = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))
  const handleClear = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const row = drawer.row
      const res = row ? await actualizarUsuario(row.id_usuario, payload) : await crearUsuario(payload)
      toast.success(res.message)
      setDrawer({ open: false, row: null })
      await onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const runConfirm = async () => {
    const { type, row } = confirm
    setBusy(true)
    try {
      const res = type === 'delete' ? await eliminarUsuario(row.id_usuario) : await resetPasswordUsuario(row.id_usuario)
      toast.success(res.message)
      if (type === 'delete') setDrawer({ open: false, row: null })
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
        <InputField label="Buscar" icon={Search} name="q" value={draft.q} onChange={handleChange} placeholder="Nombre completo o apodo" />
        <SelectField label="Estado" name="estado" value={draft.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder="Todos" />
        <SelectField label="Nivel de usuario" name="tipo" value={draft.tipo} onChange={handleChange} options={nivelFilterOptions} placeholder="Todos" />
      </FilterBlock>

      <DataTable
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        rows={filtered}
        rowKey="id_usuario"
        resetKey={applied}
        onAdd={() => setDrawer({ open: true, row: null })}
        renderActions={(row) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm"
              title={canManage(row) ? 'Editar' : 'Nivel superior al tuyo'}
              aria-label="Editar"
              disabled={!canManage(row)}
              onClick={() => setDrawer({ open: true, row })}
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm"
              title={isSelf(row) ? 'Usa «Restaurar contraseña» para la tuya' : `Restablecer contraseña a ${DEFAULT_PASSWORD}`}
              aria-label="Restablecer contraseña"
              disabled={!canManage(row) || isSelf(row)}
              onClick={() => setConfirm({ type: 'reset', row })}
            >
              <KeyRound className="size-4" />
            </button>
          </div>
        )}
      />

      <UsuarioModal
        open={drawer.open}
        row={editing}
        nivelOptions={nivelFormOptions}
        lockSelf={Boolean(editing) && isSelf(editing)}
        canDelete={Boolean(editing) && !isSelf(editing)}
        defaultPassword={DEFAULT_PASSWORD}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm({ type: 'delete', row: editing })}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.type === 'delete' ? 'Eliminar usuario' : 'Restablecer contraseña'}
        message={
          confirm?.type === 'delete'
            ? `¿Seguro que deseas eliminar a ${confirm?.row.nombres_completos}? Esta acción no se puede deshacer.`
            : `¿Restablecer la contraseña de ${confirm?.row.nombres_completos} a ${DEFAULT_PASSWORD}? Su contraseña actual dejará de funcionar.`
        }
        confirmText={confirm?.type === 'delete' ? 'Eliminar' : 'Restablecer'}
        loading={busy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
