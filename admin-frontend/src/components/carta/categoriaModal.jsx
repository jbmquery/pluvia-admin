// src/components/carta/categoriaModal.jsx
import { useState } from 'react'
import { FileText, Tags } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'categoria-form'

function CategoriaForm({ row, onSave }) {
  const [form, setForm] = useState({ nombre_cat: row?.nombre_cat ?? '', descripcion: row?.descripcion ?? '' })
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ nombre_cat: form.nombre_cat.trim(), descripcion: form.descripcion.trim() || null })
  }
  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <InputField label="Nombre de la categoría" icon={Tags} name="nombre_cat" value={form.nombre_cat} onChange={handleChange} maxLength={15} required />
      <InputField label="Descripción (opcional)" icon={FileText} name="descripcion" value={form.descripcion} onChange={handleChange} maxLength={50} />
    </form>
  )
}

export default function CategoriaModal({ open, row, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar categoría' : 'Añadir categoría'}
      onClose={onClose}
      footer={<FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} onClose={onClose} onDelete={onDelete} />}
    >
      <CategoriaForm row={row} onSave={onSave} />
    </SideDrawer>
  )
}
