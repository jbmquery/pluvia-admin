// src/components/sedes_turnos/turnoModal.jsx
import { useState } from 'react'
import { Clock, Timer } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'

const FORM_ID = 'turno-form'

const ESTADO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

const hhmm = (t) => (t ? String(t).slice(0, 5) : '')

const toForm = (row) => ({
  id_sede: row ? String(row.id_sede) : '',
  nombre_turno: row?.nombre_turno ?? '',
  hora_inicio: hhmm(row?.hora_inicio),
  hora_fin: hhmm(row?.hora_fin),
  tolerancia_minutos: row?.tolerancia_minutos != null ? String(row.tolerancia_minutos) : '',
  estado: String(row?.estado ?? true),
})

function TurnoForm({ row, sedeOptions, onSave }) {
  const [form, setForm] = useState(() => toForm(row))

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id_sede: Number(form.id_sede),
      nombre_turno: form.nombre_turno.trim(),
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      tolerancia_minutos: form.tolerancia_minutos === '' ? null : form.tolerancia_minutos,
      estado: form.estado === 'true',
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <SelectField label="Sede" name="id_sede" value={form.id_sede} onChange={handleChange} options={sedeOptions} required />
      <InputField label="Nombre del turno" icon={Clock} name="nombre_turno" value={form.nombre_turno} onChange={handleChange} maxLength={20} placeholder="Ej.: Mañana" required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Hora de inicio" type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} required />
        <InputField label="Hora de fin" type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange} required />
      </div>
      <p className="-mt-2 text-xs text-base-content/60">Si la hora de fin es menor que la de inicio, el turno cruza la medianoche.</p>
      <InputField label="Tolerancia en minutos (opcional)" icon={Timer} type="number" name="tolerancia_minutos" value={form.tolerancia_minutos} onChange={handleChange} min="0" max="240" step="1" inputMode="numeric" />
      <SelectField label="Estado" name="estado" value={form.estado} onChange={handleChange} options={ESTADO_OPTIONS} placeholder={null} />
    </form>
  )
}

export default function TurnoModal({ open, row, sedeOptions, saving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(row)
  return (
    <SideDrawer
      open={open}
      title={isEdit ? 'Editar turno' : 'Añadir turno'}
      onClose={onClose}
      footer={<FormDrawerFooter formId={FORM_ID} isEdit={isEdit} saving={saving} onClose={onClose} onDelete={onDelete} />}
    >
      <TurnoForm row={row} sedeOptions={sedeOptions} onSave={onSave} />
    </SideDrawer>
  )
}
