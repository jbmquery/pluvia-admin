// src/components/usuarios/nivelModal.jsx
import { useState } from 'react'
import { Hash, ShieldCheck, TextCursorInput } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'nivel-form'

function NivelForm({ row, maxId, onSave }) {
  const [form, setForm] = useState({
    id_tipo_usuario: row ? String(row.id_tipo_usuario) : '',
    nombre: row?.nombre ?? '',
    descripcion: row?.descripcion ?? '',
  })
  const isEdit = Boolean(row)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, id_tipo_usuario: Number(form.id_tipo_usuario) })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <InputField
        label="ID del nivel"
        icon={Hash}
        type="number"
        name="id_tipo_usuario"
        value={form.id_tipo_usuario}
        onChange={handleChange}
        min="0"
        max={maxId}
        step="1"
        required
        disabled={isEdit}
      />
      {!isEdit && (
        <p className="-mt-2 text-xs text-base-content/60">El ID lo defines tú y no se puede cambiar después. Máximo permitido para ti: {maxId}.</p>
      )}
      <InputField label="Nombre" icon={ShieldCheck} name="nombre" value={form.nombre} onChange={handleChange} maxLength={30} required />
      <InputField label="Descripción" icon={TextCursorInput} name="descripcion" value={form.descripcion} onChange={handleChange} maxLength={100} required />
    </form>
  )
}

export default function NivelModal({ open, row, maxId, canDelete, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar nivel' : 'Añadir nivel'}
      onClose={onClose}
      footer={
        <FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} canDelete={canDelete} onClose={onClose} onDelete={onDelete} />
      }
    >
      <NivelForm row={row} maxId={maxId} onSave={onSave} />
    </SideDrawer>
  )
}
