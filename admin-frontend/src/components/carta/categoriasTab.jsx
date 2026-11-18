// src/components/carta/categoriasTab.jsx
// Pocas filas: no lleva bloque de filtros (el selector de columnas, Descargar y Añadir se mantienen).
import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import DataTable from '../general/dataTableComponent'
import ConfirmModal from '../general/confirmModalComponent'
import DescargarExcel from '../general/descargarExcelComponent'
import CategoriaModal from './categoriaModal'
import { actualizarCategoria, crearCategoria, eliminarCategoria } from '../../Apis/carta/cartaApi'

const COLUMNS = [
  { key: 'id_categoria', label: 'ID' },
  { key: 'nombre_cat', label: 'Categoría' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'n_subcategorias', label: 'Subcategorías' },
  { key: 'n_platos', label: 'Platos' },
]
const DEFAULT_VISIBLE = ['id_categoria', 'nombre_cat', 'descripcion', 'n_subcategorias', 'n_platos']

export default function CategoriasTab({ categorias, onChanged }) {
  const toast = useToast()
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)

  const exportColumns = useMemo(() => COLUMNS.filter((c) => visibleKeys.includes(c.key)), [visibleKeys])

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const row = drawer.row
      const res = row ? await actualizarCategoria(row.id_categoria, payload) : await crearCategoria(payload)
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
      const res = await eliminarCategoria(confirm.id_categoria)
      toast.success(res.message)
      setDrawer({ open: false, row: null })
      setConfirm(null)
      await onChanged()
    } catch (err) {
      toast.error(err.message) // incluye el motivo (p. ej. "tiene 2 subcategoría(s) asociado(s)")
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <DataTable
        title="Categorías"
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        onVisibleChange={setVisibleKeys}
        rows={categorias}
        rowKey="id_categoria"
        onAdd={() => setDrawer({ open: true, row: null })}
        toolbarExtra={<DescargarExcel rows={categorias} columns={exportColumns} sheetName="Categorías" filePrefix="categorias" />}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button type="button" className="btn btn-ghost btn-circle btn-sm" title="Editar" aria-label="Editar" onClick={() => setDrawer({ open: true, row })}>
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <CategoriaModal
        open={drawer.open}
        row={drawer.row}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm(drawer.row)}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Eliminar categoría"
        message={`¿Seguro que deseas eliminar la categoría «${confirm?.nombre_cat}»? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
