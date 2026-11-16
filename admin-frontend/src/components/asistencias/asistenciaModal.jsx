// src/components/asistencias/asistenciaModal.jsx
// Solo edición. No se pueden cambiar id_asistencia ni id_usuario. La observación es obligatoria.
import { useMemo, useState } from 'react'
import { Hash, User } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'
import { useToast } from '../general/toastComponent'
import { ESTADOS } from '../../utils/asistenciasUtils'

const FORM_ID = 'asistencia-form'

const toForm = (row) => ({
  id_sede: String(row.id_sede),
  id_turno: String(row.id_turno),
  fecha: row.fecha,
  hora_entrada_horario: row.hora_entrada_horario ?? '',
  hora_salida_horario: row.hora_salida_horario ?? '',
  hora_entrada_real: row.hora_entrada_real ?? '',
  hora_salida_real: row.hora_salida_real ?? '',
  estado_asistencia: row.estado_asistencia,
  observacion: row.observacion ?? '',
})

function AsistenciaForm({ row, sedes, turnos, onSave }) {
  const toast = useToast()
  const [form, setForm] = useState(() => toForm(row))

  const sedeOptions = useMemo(() => sedes.map((s) => ({ value: String(s.id_sede), label: s.nombre_sede })), [sedes])
  const turnoOptions = useMemo(
    () => turnos.filter((t) => String(t.id_sede) === form.id_sede).map((t) => ({ value: String(t.id_turno), label: t.nombre_turno })),
    [turnos, form.id_sede],
  )

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // Al cambiar de sede el turno debe elegirse de nuevo
  const handleSede = (e) => setForm((f) => ({ ...f, id_sede: e.target.value, id_turno: '' }))

  // Al elegir turno se sugieren los horarios del turno (siguen siendo editables)
  const handleTurno = (e) => {
    const turno = turnos.find((t) => String(t.id_turno) === e.target.value)
    setForm((f) => ({
      ...f,
      id_turno: e.target.value,
      hora_entrada_horario: turno ? turno.hora_inicio : f.hora_entrada_horario,
      hora_salida_horario: turno ? turno.hora_fin : f.hora_salida_horario,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.observacion.trim()) {
      toast.error('La observación es obligatoria para actualizar una asistencia.')
      return
    }
    onSave({
      id_sede: Number(form.id_sede),
      id_turno: Number(form.id_turno),
      fecha: form.fecha,
      hora_entrada_horario: form.hora_entrada_horario,
      hora_salida_horario: form.hora_salida_horario,
      hora_entrada_real: form.hora_entrada_real || null,
      hora_salida_real: form.hora_salida_real || null,
      estado_asistencia: form.estado_asistencia,
      observacion: form.observacion.trim(),
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <InputField label="ID de asistencia" icon={Hash} value={row.id_asistencia} disabled readOnly />
      <InputField label="Usuario" icon={User} value={`${row.nombres_completos} (${row.apodo})`} disabled readOnly />
      <SelectField label="Sede" name="id_sede" value={form.id_sede} onChange={handleSede} options={sedeOptions} placeholder={null} required />
      <SelectField label="Turno" name="id_turno" value={form.id_turno} onChange={handleTurno} options={turnoOptions} placeholder="Seleccionar turno" required />
      <InputField label="Fecha" type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Entrada (horario)" type="time" step="1" name="hora_entrada_horario" value={form.hora_entrada_horario} onChange={handleChange} required />
        <InputField label="Salida (horario)" type="time" step="1" name="hora_salida_horario" value={form.hora_salida_horario} onChange={handleChange} required />
        <InputField label="Entrada real" type="time" step="1" name="hora_entrada_real" value={form.hora_entrada_real} onChange={handleChange} />
        <InputField label="Salida real" type="time" step="1" name="hora_salida_real" value={form.hora_salida_real} onChange={handleChange} />
      </div>
      <SelectField label="Estado" name="estado_asistencia" value={form.estado_asistencia} onChange={handleChange} options={ESTADOS} placeholder={null} required />
      <div className="w-full">
        <label htmlFor="asistencia-observacion" className="mb-1.5 block text-sm font-medium text-base-content/80">
          Observación <span className="text-error">*</span>
        </label>
        <textarea
          id="asistencia-observacion"
          name="observacion"
          value={form.observacion}
          onChange={handleChange}
          rows={3}
          maxLength={255}
          aria-required="true"
          placeholder="Explica el motivo del cambio"
          className="textarea w-full border-white/10 bg-base-300 text-base"
        />
        <p className="mt-1 text-xs text-base-content/60">Obligatoria al actualizar. {form.observacion.length}/255</p>
      </div>
    </form>
  )
}

export default function AsistenciaModal({ open, row, sedes, turnos, saving, onClose, onSave }) {
  return (
    <SideDrawer
      open={open}
      title="Editar asistencia"
      onClose={onClose}
      footer={<FormDrawerFooter formId={FORM_ID} isEdit saving={saving} onClose={onClose} />}
    >
      {row && <AsistenciaForm key={row.id_asistencia} row={row} sedes={sedes} turnos={turnos} onSave={onSave} />}
    </SideDrawer>
  )
}
