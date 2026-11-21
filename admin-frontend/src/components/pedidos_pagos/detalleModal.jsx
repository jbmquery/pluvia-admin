// src/components/pedidos_pagos/detalleModal.jsx
// Solo edición. No se pueden cambiar id_detalle, id_pedido, id_detalle_padre ni canjeado_por.
import { useMemo, useState } from 'react'
import { Hash } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'
import { ESTADOS_DETALLE, optionsWithCurrent } from '../../utils/pedidosUtils'

const FORM_ID = 'detalle-form'
const str = (v) => (v === null || v === undefined ? '' : String(v))

const SI_NO = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]

function DetalleForm({ row, cartaOptions, onSave }) {
  const [form, setForm] = useState(() => ({
    id_carta: str(row.id_carta),
    cantidad: str(row.cantidad),
    precio_unitario: row.precio_unitario === null || row.precio_unitario === undefined ? '' : Number(row.precio_unitario).toFixed(2),
    observacion: str(row.observacion),
    es_canjeable: String(row.es_canjeable === true),
    estado: str(row.estado),
    cuenta: str(row.cuenta),
  }))
  const estadoOptions = useMemo(() => optionsWithCurrent(ESTADOS_DETALLE, row.estado), [row.estado])
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id_carta: Number(form.id_carta),
      cantidad: form.cantidad,
      precio_unitario: form.precio_unitario === '' ? null : form.precio_unitario,
      observacion: form.observacion.trim() || null,
      es_canjeable: form.es_canjeable === 'true',
      estado: form.estado || null,
      cuenta: form.cuenta === '' ? null : form.cuenta,
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputField label="ID de detalle" icon={Hash} value={row.id_detalle} disabled readOnly />
        <InputField label="ID de pedido" icon={Hash} value={row.id_pedido} disabled readOnly />
        <InputField label="N° de orden" icon={Hash} value={row.numero_orden} disabled readOnly />
      </div>
      {(row.id_detalle_padre !== null || row.canjeado_por !== null) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Detalle padre" value={str(row.id_detalle_padre)} disabled readOnly />
          <InputField label="Canjeado por" value={str(row.canjeado_por)} disabled readOnly />
        </div>
      )}
      <SelectField label="Plato" name="id_carta" value={form.id_carta} onChange={handleChange} options={cartaOptions} placeholder="Seleccionar plato" required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Cantidad" type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min="0" step="1" inputMode="numeric" required />
        <InputField label="Precio unitario" type="number" name="precio_unitario" value={form.precio_unitario} onChange={handleChange} min="0" step="0.01" inputMode="decimal" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Es canjeable" name="es_canjeable" value={form.es_canjeable} onChange={handleChange} options={SI_NO} placeholder={null} />
        <SelectField label="Estado" name="estado" value={form.estado} onChange={handleChange} options={estadoOptions} placeholder="Sin estado" />
      </div>
      <InputField label="Cuenta (opcional)" type="number" name="cuenta" value={form.cuenta} onChange={handleChange} min="0" step="1" inputMode="numeric" />
      <div className="w-full">
        <label htmlFor="detalle-observacion" className="mb-1.5 block text-sm font-medium text-base-content/80">Observación (opcional)</label>
        <textarea id="detalle-observacion" name="observacion" value={form.observacion} onChange={handleChange} rows={3} maxLength={1000} className="textarea w-full border-white/10 bg-base-300 text-base" />
      </div>
    </form>
  )
}

export default function DetalleModal({ open, row, cartaOptions, saving, onClose, onSave }) {
  return (
    <SideDrawer open={open} title="Editar detalle de pedido" onClose={onClose} footer={<FormDrawerFooter formId={FORM_ID} isEdit saving={saving} onClose={onClose} />}>
      {row && <DetalleForm key={row.id_detalle} row={row} cartaOptions={cartaOptions} onSave={onSave} />}
    </SideDrawer>
  )
}
