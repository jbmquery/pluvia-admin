// src/components/usuarios/empleadoModal.jsx
import { useState } from 'react'
import { Banknote, Clock, FileText } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'empleado-form'

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

const toForm = (row) => ({
  id_usuario: row ? String(row.id_usuario) : '',
  id_sede: row?.id_sede != null ? String(row.id_sede) : '',
  sueldo: row?.sueldo != null ? String(row.sueldo) : '',
  tipo_contrato: row?.tipo_contrato ?? '',
  fecha_inicio: row?.fecha_inicio ?? '',
  fecha_fin: row?.fecha_fin ?? '',
  estado: String(row?.estado ?? true),
  tipo_usuario: row?.tipo_usuario != null ? String(row.tipo_usuario) : '',
  observacion: row?.observacion ?? '',
  turno_referencia: row?.turno_referencia ?? '',
})

function EmpleadoForm({ row, usuarioOptions, sedeOptions, nivelOptions, onSave }) {
  const [form, setForm] = useState(() => toForm(row))

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id_usuario: Number(form.id_usuario),
      id_sede: form.id_sede ? Number(form.id_sede) : null,
      sueldo: form.sueldo === '' ? null : form.sueldo,
      tipo_contrato: form.tipo_contrato.trim() || null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      estado: form.estado === 'true',
      tipo_usuario: form.tipo_usuario ? Number(form.tipo_usuario) : null,
      observacion: form.observacion.trim() || null,
      turno_referencia: form.turno_referencia.trim() || null,
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <SelectField label="Usuario" name="id_usuario" value={form.id_usuario} onChange={handleChange} options={usuarioOptions} required />
      <SelectField label="Sede (opcional)" name="id_sede" value={form.id_sede} onChange={handleChange} options={sedeOptions} />
      <SelectField label="Nivel (opcional)" name="tipo_usuario" value={form.tipo_usuario} onChange={handleChange} options={nivelOptions} />
      <InputField label="Sueldo (opcional)" icon={Banknote} type="number" name="sueldo" value={form.sueldo} onChange={handleChange} min="0" max="99999999.99" step="0.01" inputMode="decimal" />
      <InputField label="Tipo de contrato (opcional)" icon={FileText} name="tipo_contrato" value={form.tipo_contrato} onChange={handleChange} maxLength={30} />
      <InputField label="Turno de referencia (opcional)" icon={Clock} name="turno_referencia" value={form.turno_referencia} onChange={handleChange} maxLength={40} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Fecha de inicio" type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} required />
        <InputField label="Fecha fin" type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} min={form.fecha_inicio || undefined} />
      </div>
      <SelectField label="Estado" name="estado" value={form.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder={null} />
      <div className="w-full">
        <label htmlFor="empleado-observacion" className="mb-1.5 block text-sm font-medium text-base-content/80">
          Observación (opcional)
        </label>
        <textarea
          id="empleado-observacion"
          name="observacion"
          value={form.observacion}
          onChange={handleChange}
          rows={3}
          maxLength={1000}
          className="textarea w-full border-white/10 bg-base-300/60 text-base"
        />
      </div>
    </form>
  )
}

export default function EmpleadoModal({ open, row, usuarioOptions, sedeOptions, nivelOptions, canDelete, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar empleado' : 'Añadir empleado'}
      onClose={onClose}
      footer={
        <FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} canDelete={canDelete} onClose={onClose} onDelete={onDelete} />
      }
    >
      <EmpleadoForm row={row} usuarioOptions={usuarioOptions} sedeOptions={sedeOptions} nivelOptions={nivelOptions} onSave={onSave} />
    </SideDrawer>
  )
}
