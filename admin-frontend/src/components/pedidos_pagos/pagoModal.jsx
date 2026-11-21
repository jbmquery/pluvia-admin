// src/components/pedidos_pagos/pagoModal.jsx
// Solo edición. No se pueden cambiar id_pago ni id_pedido.
import { useMemo, useState } from 'react'
import { Banknote, Hash } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'
import { METODOS_PAGO, dtLocal, optionsWithCurrent } from '../../utils/pedidosUtils'

const FORM_ID = 'pago-form'

function PagoForm({ row, onSave }) {
  const [form, setForm] = useState(() => ({
    cuenta: String(row.cuenta ?? ''),
    monto_total: Number(row.monto_total).toFixed(2),
    metodo_pago: row.metodo_pago ?? '',
    fecha_pago: dtLocal(row.fecha_pago),
    observacion: row.observacion ?? '',
  }))
  const metodoOptions = useMemo(() => optionsWithCurrent(METODOS_PAGO, row.metodo_pago), [row.metodo_pago])
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      cuenta: form.cuenta,
      monto_total: form.monto_total,
      metodo_pago: form.metodo_pago,
      // si no se tocó, se envía el valor original (conserva los decimales de los segundos)
      fecha_pago: form.fecha_pago === dtLocal(row.fecha_pago) ? row.fecha_pago : form.fecha_pago,
      observacion: form.observacion.trim() || null,
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputField label="ID de pago" icon={Hash} value={row.id_pago} disabled readOnly />
        <InputField label="ID de pedido" icon={Hash} value={row.id_pedido} disabled readOnly />
        <InputField label="N° de orden" icon={Hash} value={row.numero_orden} disabled readOnly />
      </div>
      <InputField label="Cuenta" type="number" name="cuenta" value={form.cuenta} onChange={handleChange} min="0" step="1" inputMode="numeric" required />
      <InputField label="Monto total" icon={Banknote} type="number" name="monto_total" value={form.monto_total} onChange={handleChange} min="0" step="0.01" inputMode="decimal" required />
      <SelectField label="Método de pago" name="metodo_pago" value={form.metodo_pago} onChange={handleChange} options={metodoOptions} placeholder="Seleccionar método" required />
      <InputField label="Fecha y hora de pago" type="datetime-local" step="1" name="fecha_pago" value={form.fecha_pago} onChange={handleChange} required />
      <div className="w-full">
        <label htmlFor="pago-observacion" className="mb-1.5 block text-sm font-medium text-base-content/80">Observación (opcional)</label>
        <textarea id="pago-observacion" name="observacion" value={form.observacion} onChange={handleChange} rows={3} maxLength={1000} className="textarea w-full border-white/10 bg-base-300 text-base" />
      </div>
    </form>
  )
}

export default function PagoModal({ open, row, saving, onClose, onSave }) {
  return (
    <SideDrawer open={open} title="Editar pago" onClose={onClose} footer={<FormDrawerFooter formId={FORM_ID} isEdit saving={saving} onClose={onClose} />}>
      {row && <PagoForm key={row.id_pago} row={row} onSave={onSave} />}
    </SideDrawer>
  )
}
