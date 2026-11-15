// src/components/usuarios/nivelesTab.jsx
import { useMemo, useState } from 'react'
import { Pencil, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import ConfirmModal from '../general/confirmModalComponent'
import NivelModal from './nivelModal'
import { normalizeText } from '../../utils/formatUtils'
import { actualizarNivel, crearNivel, eliminarNivel } from '../../Apis/usuarios/usuariosApi'

const COLUMNS = [
  { key: 'id_tipo_usuario', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
]

export default function NivelesTab({ niveles, onChanged }) {
  const toast = useToast()
  const { user: me } = useAuth()

  const [draft, setDraft] = useState('')
  const [applied, setApplied] = useState('')
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = normalizeText(applied)
    return q ? niveles.filter((n) => normalizeText(n.nombre).includes(q)) : niveles
  }, [niveles, applied])

  const canManage = (row) => row.id_tipo_usuario <= me.tipo_usuario

  const handleClear = () => {
    setDraft('')
    setApplied('')
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const row = drawer.row
      const res = row ? await actualizarNivel(row.id_tipo_usuario, payload) : await crearNivel(payload)
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
      const res = await eliminarNivel(confirm.id_tipo_usuario)
      toast.success(res.message)
      setDrawer({ open: false, row: null })
      setConfirm(null)
      await onChanged()
    } catch (err) {
      toast.error(err.message) // incluye el motivo (p. ej. "asignado a 3 usuario(s)")
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  const editing = drawer.row

  return (
    <div className="space-y-4">
      <FilterBlock onSearch={() => setApplied(draft)} onClear={handleClear}>
        <InputField label="Buscar" icon={Search} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nombre del nivel" />
      </FilterBlock>

      <DataTable
        columns={COLUMNS}
        rows={filtered}
        rowKey="id_tipo_usuario"
        resetKey={applied}
        onAdd={() => setDrawer({ open: true, row: null })}
        renderActions={(row) => (
          <div className="flex justify-end">
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
          </div>
        )}
      />

      <NivelModal
        open={drawer.open}
        row={editing}
        maxId={me.tipo_usuario}
        canDelete={Boolean(editing)}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm(editing)}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Eliminar nivel"
        message={`¿Seguro que deseas eliminar el nivel «${confirm?.nombre}»? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
