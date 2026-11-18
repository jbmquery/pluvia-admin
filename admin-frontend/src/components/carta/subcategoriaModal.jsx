// src/components/carta/subcategoriaModal.jsx
import { useState } from 'react'
import { FileText, Layers } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'subcategoria-form'

function SubcategoriaForm({ row, categoriaOptions, onSave }) {
  const [form, setForm] = useState({
    nombre_subcat: row?.nombre_subcat ?? '',
    descripcion: row?.descripcion ?? '',
    categoria: row?.categoria != null ? String(row.categoria) : '',
  })
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ nombre_subcat: form.nombre_subcat.trim(), descripcion: form.descripcion.trim() || null, categoria: Number(form.categoria) })
  }
  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <SelectField label="Categoría" name="categoria" value={form.categoria} onChange={handleChange} options={categoriaOptions} required />
      <InputField label="Nombre de la subcategoría" icon={Layers} name="nombre_subcat" value={form.nombre_subcat} onChange={handleChange} maxLength={30} required />
      <InputField label="Descripción (opcional)" icon={FileText} name="descripcion" value={form.descripcion} onChange={handleChange} maxLength={50} />
    </form>
  )
}

export default function SubcategoriaModal({ open, row, categoriaOptions, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar subcategoría' : 'Añadir subcategoría'}
      onClose={onClose}
      footer={<FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} onClose={onClose} onDelete={onDelete} />}
    >
      <SubcategoriaForm row={row} categoriaOptions={categoriaOptions} onSave={onSave} />
    </SideDrawer>
  )
}
