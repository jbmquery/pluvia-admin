// src/components/carta/cartaTab.jsx
import { useMemo, useState } from 'react'
import { Pencil, Search } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import EstadoBadge from '../general/estadoBadgeComponent'
import ConfirmModal from '../general/confirmModalComponent'
import DescargarExcel from '../general/descargarExcelComponent'
import PlatoModal from './platoModal'
import { formatMoney, normalizeText } from '../../utils/formatUtils'
import { actualizarPlato, crearPlato, eliminarPlato } from '../../Apis/carta/cartaApi'

const EMPTY = { q: '', categoria: '', subcategoria: '', estado: '', disponible: '' }

const DisponibleBadge = ({ value }) => (
  <span className={`badge badge-soft whitespace-nowrap ${value ? 'badge-success' : 'badge-warning'}`}>{value ? 'Disponible' : 'No disponible'}</span>
)

const COLUMNS = [
  { key: 'id_carta', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'grupo', label: 'Grupo' },
  { key: 'abreviado', label: 'Abreviado' },
  { key: 'nombre_categoria', label: 'Categoría' },
  { key: 'nombre_subcategoria', label: 'Subcategoría' },
  { key: 'precio', label: 'Precio', render: (r) => formatMoney(r.precio), text: (r) => Number(r.precio), numFmt: '0.00' },
  { key: 'puntos_canje', label: 'Puntos de canje' },
  { key: 'estado', label: 'Estado', render: (r) => <EstadoBadge value={r.estado} />, text: (r) => (r.estado ? 'Activo' : 'Inactivo') },
  { key: 'disponible', label: 'Disponibilidad', render: (r) => <DisponibleBadge value={r.disponible} />, text: (r) => (r.disponible ? 'Disponible' : 'No disponible') },
  { key: 'porcion', label: 'Porción' },
  { key: 'unidad_medida', label: 'Unidad de medida' },
  { key: 'observacion', label: 'Observación' },
  { key: 'url_imagen', label: 'Imagen' },
]
const DEFAULT_VISIBLE = ['id_carta', 'nombre', 'grupo', 'abreviado', 'nombre_categoria', 'nombre_subcategoria', 'precio', 'estado', 'disponible']

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]
const DISPONIBLE_OPTIONS = [
  { value: 'true', label: 'Disponible' },
  { value: 'false', label: 'No disponible' },
]

export default function CartaTab({ carta, categorias, subcategorias, onChanged }) {
  const toast = useToast()

  const [draft, setDraft] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [drawer, setDrawer] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)

  // Filtrado local: no consulta la base de datos
  const filtered = useMemo(() => {
    const q = normalizeText(applied.q)
    return carta.filter((p) => {
      if (q && ![p.nombre, p.grupo, p.abreviado].some((v) => normalizeText(v).includes(q))) return false
      if (applied.categoria !== '' && String(p.categoria) !== applied.categoria) return false
      if (applied.subcategoria !== '' && String(p.sub_categoria) !== applied.subcategoria) return false
      if (applied.estado !== '' && String(p.estado) !== applied.estado) return false
      if (applied.disponible !== '' && String(p.disponible) !== applied.disponible) return false
      return true
    })
  }, [carta, applied])

  const categoriaOptions = useMemo(() => categorias.map((c) => ({ value: String(c.id_categoria), label: c.nombre_cat })), [categorias])

  // Filtro Subcategoría: si hay categoría elegida, solo sus subcategorías
  const subFilterOptions = useMemo(
    () =>
      subcategorias
        .filter((s) => draft.categoria === '' || String(s.categoria) === draft.categoria)
        .map((s) => ({ value: String(s.id_subcat), label: draft.categoria === '' ? `${s.nombre_subcat} · ${s.nombre_categoria ?? 'sin categoría'}` : s.nombre_subcat })),
    [subcategorias, draft.categoria],
  )

  const exportColumns = useMemo(() => COLUMNS.filter((c) => visibleKeys.includes(c.key)), [visibleKeys])

  const handleChange = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))
  const handleCategoria = (e) => setDraft((d) => ({ ...d, categoria: e.target.value, subcategoria: '' }))
  const handleClear = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const row = drawer.row
      const res = row ? await actualizarPlato(row.id_carta, payload) : await crearPlato(payload)
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
      const res = await eliminarPlato(confirm.id_carta)
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
        <InputField label="Buscar" icon={Search} name="q" value={draft.q} onChange={handleChange} placeholder="Nombre, grupo o abreviado" />
        <SelectField label="Categoría" name="categoria" value={draft.categoria} onChange={handleCategoria} options={categoriaOptions} placeholder="Todas" />
        <SelectField label="Subcategoría" name="subcategoria" value={draft.subcategoria} onChange={handleChange} options={subFilterOptions} placeholder="Todas" />
        <SelectField label="Estado" name="estado" value={draft.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder="Todos" />
        <SelectField label="Disponibilidad" name="disponible" value={draft.disponible} onChange={handleChange} options={DISPONIBLE_OPTIONS} placeholder="Todas" />
      </FilterBlock>

      <DataTable
        title="Carta"
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        onVisibleChange={setVisibleKeys}
        rows={filtered}
        rowKey="id_carta"
        resetKey={applied}
        onAdd={() => setDrawer({ open: true, row: null })}
        toolbarExtra={<DescargarExcel rows={filtered} columns={exportColumns} sheetName="Carta" filePrefix="carta" />}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button type="button" className="btn btn-ghost btn-circle btn-sm" title="Editar" aria-label="Editar" onClick={() => setDrawer({ open: true, row })}>
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <PlatoModal
        open={drawer.open}
        row={drawer.row}
        categoriaOptions={categoriaOptions}
        subcategorias={subcategorias}
        saving={saving}
        onClose={() => setDrawer({ open: false, row: null })}
        onSave={handleSave}
        onDelete={() => setConfirm(drawer.row)}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Eliminar plato"
        message={`¿Seguro que deseas eliminar «${confirm?.nombre}»? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
