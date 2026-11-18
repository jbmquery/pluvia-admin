// src/components/carta/platoModal.jsx
import { useMemo, useState } from 'react'
import { Banknote, Gift, Image, Ruler, Tag, Utensils } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'plato-form'

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]
const DISPONIBLE_OPTIONS = [
  { value: 'true', label: 'Disponible' },
  { value: 'false', label: 'No disponible' },
]

const str = (v) => (v === null || v === undefined ? '' : String(v))

const toForm = (row) => ({
  categoria: row ? String(row.categoria) : '',
  sub_categoria: row ? String(row.sub_categoria) : '',
  nombre: str(row?.nombre),
  grupo: str(row?.grupo),
  abreviado: str(row?.abreviado),
  precio: row ? Number(row.precio).toFixed(2) : '',
  puntos_canje: str(row?.puntos_canje),
  estado: String(row?.estado ?? true),
  disponible: String(row?.disponible ?? true),
  porcion: str(row?.porcion),
  unidad_medida: str(row?.unidad_medida),
  observacion: str(row?.observacion),
  url_imagen: str(row?.url_imagen),
})

function PlatoForm({ row, categoriaOptions, subcategorias, onSave }) {
  const [form, setForm] = useState(() => toForm(row))

  // La subcategoría depende de la categoría (las que no tienen categoría se ofrecen en todas)
  const subOptions = useMemo(
    () =>
      subcategorias
        .filter((s) => s.categoria === null || String(s.categoria) === form.categoria)
        .map((s) => ({ value: String(s.id_subcat), label: s.categoria === null ? `${s.nombre_subcat} (sin categoría)` : s.nombre_subcat })),
    [subcategorias, form.categoria],
  )

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleCategoria = (e) => setForm((f) => ({ ...f, categoria: e.target.value, sub_categoria: '' }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      categoria: Number(form.categoria),
      sub_categoria: Number(form.sub_categoria),
      nombre: form.nombre.trim(),
      grupo: form.grupo.trim(),
      abreviado: form.abreviado.trim(),
      precio: form.precio,
      puntos_canje: form.puntos_canje === '' ? null : form.puntos_canje,
      estado: form.estado === 'true',
      disponible: form.disponible === 'true',
      porcion: form.porcion.trim() || null,
      unidad_medida: form.unidad_medida.trim() || null,
      observacion: form.observacion.trim() || null,
      url_imagen: form.url_imagen.trim() || null,
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <InputField label="Nombre" icon={Utensils} name="nombre" value={form.nombre} onChange={handleChange} maxLength={50} required />
      <InputField label="Grupo" icon={Tag} name="grupo" value={form.grupo} onChange={handleChange} maxLength={50} required />
      <InputField label="Nombre abreviado" name="abreviado" value={form.abreviado} onChange={handleChange} maxLength={30} required />
      <SelectField label="Categoría" name="categoria" value={form.categoria} onChange={handleCategoria} options={categoriaOptions} required />
      <SelectField
        label="Subcategoría"
        name="sub_categoria"
        value={form.sub_categoria}
        onChange={handleChange}
        options={subOptions}
        placeholder={form.categoria ? 'Seleccionar subcategoría' : 'Primero elige una categoría'}
        disabled={!form.categoria}
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Precio" icon={Banknote} type="number" name="precio" value={form.precio} onChange={handleChange} min="0" max="99999999.99" step="0.01" inputMode="decimal" required />
        <InputField label="Puntos de canje (opcional)" icon={Gift} type="number" name="puntos_canje" value={form.puntos_canje} onChange={handleChange} min="0" step="1" inputMode="numeric" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Estado" name="estado" value={form.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder={null} />
        <SelectField label="Disponibilidad" name="disponible" value={form.disponible} onChange={handleChange} options={DISPONIBLE_OPTIONS} placeholder={null} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Porción (opcional)" name="porcion" value={form.porcion} onChange={handleChange} maxLength={15} />
        <InputField label="Unidad de medida (opcional)" icon={Ruler} name="unidad_medida" value={form.unidad_medida} onChange={handleChange} maxLength={20} />
      </div>
      <InputField label="Observación (opcional)" name="observacion" value={form.observacion} onChange={handleChange} maxLength={100} />
      <InputField label="Imagen (opcional)" icon={Image} name="url_imagen" value={form.url_imagen} onChange={handleChange} maxLength={50} placeholder="Nombre de archivo o URL" />
    </form>
  )
}

export default function PlatoModal({ open, row, categoriaOptions, subcategorias, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar plato' : 'Añadir plato'}
      onClose={onClose}
      footer={<FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} onClose={onClose} onDelete={onDelete} />}
    >
      <PlatoForm row={row} categoriaOptions={categoriaOptions} subcategorias={subcategorias} onSave={onSave} />
    </SideDrawer>
  )
}
