// src/components/sedes_turnos/sedeModal.jsx
import { useState } from 'react'
import { Building2, MapPin, Tag, Users } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'sede-form'

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

const str = (v) => (v === null || v === undefined ? '' : String(v))

const toForm = (row) => ({
  nombre_sede: str(row?.nombre_sede),
  direccion: str(row?.direccion),
  tipo_sede: str(row?.tipo_sede),
  capacidad: str(row?.capacidad),
  estado: String(row?.estado ?? true),
  latitud: str(row?.latitud),
  longitud: str(row?.longitud),
})

function SedeForm({ row, onSave }) {
  const [form, setForm] = useState(() => toForm(row))

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      nombre_sede: form.nombre_sede.trim(),
      direccion: form.direccion.trim() || null,
      tipo_sede: form.tipo_sede.trim() || null,
      capacidad: form.capacidad === '' ? null : form.capacidad,
      estado: form.estado === 'true',
      latitud: form.latitud === '' ? null : form.latitud,
      longitud: form.longitud === '' ? null : form.longitud,
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <InputField label="Nombre de la sede" icon={Building2} name="nombre_sede" value={form.nombre_sede} onChange={handleChange} maxLength={50} required />
      <InputField label="Dirección (opcional)" icon={MapPin} name="direccion" value={form.direccion} onChange={handleChange} maxLength={50} />
      <InputField label="Tipo de sede (opcional)" icon={Tag} name="tipo_sede" value={form.tipo_sede} onChange={handleChange} maxLength={15} placeholder="Ej.: Principal, Sucursal" />
      <InputField label="Capacidad (opcional)" icon={Users} type="number" name="capacidad" value={form.capacidad} onChange={handleChange} min="0" step="1" inputMode="numeric" />
      <SelectField label="Estado" name="estado" value={form.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder={null} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Latitud (opcional)" type="number" name="latitud" value={form.latitud} onChange={handleChange} min="-90" max="90" step="any" inputMode="decimal" />
        <InputField label="Longitud (opcional)" type="number" name="longitud" value={form.longitud} onChange={handleChange} min="-180" max="180" step="any" inputMode="decimal" />
      </div>
      <p className="-mt-2 text-xs text-base-content/60">Latitud y longitud deben indicarse juntas o dejarse ambas vacías.</p>
    </form>
  )
}

export default function SedeModal({ open, row, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar sede' : 'Añadir sede'}
      onClose={onClose}
      footer={<FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} onClose={onClose} onDelete={onDelete} />}
    >
      <SedeForm row={row} onSave={onSave} />
    </SideDrawer>
  )
}
