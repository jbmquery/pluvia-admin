// src/components/carta/subcategoriasTab.jsx
import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import SelectField from '../general/selectFieldComponent'
import ConfirmModal from '../general/confirmModalComponent'
import DescargarExcel from '../general/descargarExcelComponent'
import SubcategoriaModal from './subcategoriaModal'
import { actualizarSubcategoria, crearSubcategoria, eliminarSubcategoria } from '../../Apis/carta/cartaApi'

const COLUMNS = [
  { key: 'id_subcat', label: 'ID' },
  { key: 'nombre_subcat', label: 'Subcategoría' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'nombre_categoria', label: 'Categoría' },
  { key: 'n_platos', label: 'Platos' },
]
const DEFAULT_VISIBLE = ['id_subcat', 'nombre_subcat', 'descripcion', 'nombre_categoria', 'n_platos']

export default function SubcategoriasTab({ subcategorias, categorias, onChanged }) {
  const toast = useToast()

  const [draft, setDraft] = useState('')
  const [applied, setApplied] = useState('')
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)

  // Filtro local por categoría
  const filtered = useMemo(
    () => (applied === '' ? subcategorias : subcategorias.filter((s) => String(s.categoria) === applied)),
    [subcategorias, applied],
  )
  const categoriaOptions = useMemo(() => categorias.map((c) => ({ value: String(c.id_categoria), label: c.nombre_cat })), [categorias])
  const exportColumns = useMemo(() => COLUMNS.filter((c) => visibleKeys.includes(c.key)), [visibleKeys])

  const handleClear = () => {
    setDraft('')
    setApplied('')
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const row = drawer.row
      const res = row ? await actualizarSubcategoria(row.id_subcat, payload) : await crearSubcategoria(payload)
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
      const res = await eliminarSubcategoria(confirm.id_subcat)
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
        <SelectField label="Categoría" value={draft} onChange={(e) => setDraft(e.target.value)} options={categoriaOptions} placeholder="Todas" />
      </FilterBlock>

      <DataTable
        title="Subcategorías"
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        onVisibleChange={setVisibleKeys}
        rows={filtered}
        rowKey="id_subcat"
        resetKey={applied}
        onAdd={() => setDrawer({ open: true, row: null })}
        toolbarExtra={<DescargarExcel rows={filtered} columns={exportColumns} sheetName="Subcategorías" filePrefix="subcategorias" />}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button type="button" className="btn btn-ghost btn-circle btn-sm" title="Editar" aria-label="Editar" onClick={() => setDrawer({ open: true, row })}>
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <SubcategoriaModal
        open={drawer.open}
        row={drawer.row}
        categoriaOptions={categoriaOptions}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm(drawer.row)}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Eliminar subcategoría"
        message={`¿Seguro que deseas eliminar la subcategoría «${confirm?.nombre_subcat}»? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
