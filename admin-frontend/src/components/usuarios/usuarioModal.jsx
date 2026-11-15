// src/components/usuarios/usuarioModal.jsx
import { useState } from 'react'
import { AtSign, Info, Mail, Phone, User } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import ToggleField from '../general/toggleFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'usuario-form'

const toForm = (row) => ({
  nombres: row?.nombres ?? '',
  ape_paterno: row?.ape_paterno ?? '',
  ape_materno: row?.ape_materno ?? '',
  apodo: row?.apodo ?? '',
  correo: row?.correo ?? '',
  tipo_usuario: row ? String(row.tipo_usuario) : '',
  estado: row?.estado ?? true,
  celular: row?.celular ?? '',
  fecha_nacimiento: row?.fecha_nacimiento ?? '',
  fecha_contratacion: row?.fecha_contratacion ?? '',
})

function UsuarioForm({ row, nivelOptions, lockSelf, defaultPassword, onSave }) {
  const [form, setForm] = useState(() => toForm(row))
  const isEdit = Boolean(row)

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      tipo_usuario: Number(form.tipo_usuario),
      celular: form.celular.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      fecha_contratacion: form.fecha_contratacion || null,
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      {!isEdit && (
        <div role="alert" className="alert alert-info alert-soft text-sm">
          <Info className="size-5 shrink-0" />
          <span>
            La contraseña inicial será <strong>{defaultPassword}</strong>. El usuario puede cambiarla en «Restaurar contraseña».
          </span>
        </div>
      )}
      <InputField label="Nombres" icon={User} name="nombres" value={form.nombres} onChange={handleChange} maxLength={50} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Apellido paterno" name="ape_paterno" value={form.ape_paterno} onChange={handleChange} maxLength={30} required />
        <InputField label="Apellido materno" name="ape_materno" value={form.ape_materno} onChange={handleChange} maxLength={30} required />
      </div>
      <InputField label="Apodo" icon={AtSign} name="apodo" value={form.apodo} onChange={handleChange} maxLength={30} required />
      <InputField label="Correo" icon={Mail} type="email" name="correo" value={form.correo} onChange={handleChange} maxLength={100} required autoComplete="off" />
      <SelectField
        label="Nivel de usuario"
        name="tipo_usuario"
        value={form.tipo_usuario}
        onChange={handleChange}
        options={nivelOptions}
        required
        disabled={lockSelf}
      />
      <ToggleField label="Usuario activo" name="estado" checked={form.estado} onChange={handleChange} disabled={lockSelf} />
      <InputField label="Celular (opcional)" icon={Phone} type="tel" name="celular" value={form.celular} onChange={handleChange} maxLength={20} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Fecha de nacimiento" type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
        <InputField label="Fecha de contratación" type="date" name="fecha_contratacion" value={form.fecha_contratacion} onChange={handleChange} />
      </div>
      {lockSelf && (
        <p className="text-xs text-base-content/60">No puedes cambiar tu propio nivel ni tu propio estado.</p>
      )}
    </form>
  )
}

export default function UsuarioModal({ open, row, nivelOptions, lockSelf, canDelete, defaultPassword, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar usuario' : 'Añadir usuario'}
      onClose={onClose}
      footer={
        <FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} canDelete={canDelete} onClose={onClose} onDelete={onDelete} />
      }
    >
      <UsuarioForm row={row} nivelOptions={nivelOptions} lockSelf={lockSelf} defaultPassword={defaultPassword} onSave={onSave} />
    </SideDrawer>
  )
}
