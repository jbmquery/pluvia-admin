// src/components/pedidos_pagos/pedidoModal.jsx
// Solo edición. No se pueden cambiar id_pedido ni numero_orden.
import { useMemo, useState } from 'react'
import { Banknote, Hash, Users } from 'lucide-react'
import SideDrawer from '../general/sideDrawerComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import FormDrawerFooter from '../general/formDrawerFooterComponent'
import { ESTADOS_PEDIDO, METODOS_PAGO, hms, offsetOf, optionsWithCurrent } from '../../utils/pedidosUtils'

const FORM_ID = 'pedido-form'
const str = (v) => (v === null || v === undefined ? '' : String(v))
const money = (v) => (v === null || v === undefined ? '' : Number(v).toFixed(2))

const toForm = (row) => ({
  id_mesa: str(row.id_mesa),
  id_cliente: str(row.id_cliente),
  id_usuario: str(row.id_usuario),
  fecha: str(row.fecha),
  hora_pedido: hms(row.hora_pedido),
  hora_entrega: hms(row.hora_entrega),
  hora_pago: hms(row.hora_pago),
  estado: str(row.estado),
  cantidad_clientes: str(row.cantidad_clientes),
  observacion: str(row.observacion),
  forma_pago: str(row.forma_pago),
  puntos_canjeados_total: str(row.puntos_canjeados_total),
  monto_pagado: money(row.monto_pagado),
  monto_vuelto: money(row.monto_vuelto),
})

function PedidoForm({ row, mesas, usuarios, clientesConocidos, onSave }) {
  const [form, setForm] = useState(() => toForm(row))

  const mesaOptions = useMemo(() => mesas.map((m) => ({ value: String(m.id_mesas), label: m.nombre })), [mesas])
  const usuarioOptions = useMemo(() => usuarios.map((u) => ({ value: String(u.id_usuario), label: `${u.nombres_completos} (${u.apodo})` })), [usuarios])
  const estadoOptions = useMemo(() => optionsWithCurrent(ESTADOS_PEDIDO, row.estado), [row.estado])
  const pagoOptions = useMemo(() => optionsWithCurrent(METODOS_PAGO, row.forma_pago), [row.forma_pago])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const clienteHint = !form.id_cliente
    ? 'Sin cliente.'
    : clientesConocidos[form.id_cliente]
      ? `Cliente: ${clientesConocidos[form.id_cliente]}`
      : 'El cliente se validará al guardar.'

  // Las horas llevan zona horaria: si no se tocan se envían tal cual; si se cambian, con la misma zona de la fila
  const zona = offsetOf(row.hora_pedido) || offsetOf(row.hora_entrega) || offsetOf(row.hora_pago)
  const hora = (campo) => {
    if (form[campo] === '') return null
    if (form[campo] === hms(row[campo])) return row[campo]
    return (form[campo].length === 5 ? `${form[campo]}:00` : form[campo]) + zona
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id_mesa: form.id_mesa === '' ? null : Number(form.id_mesa),
      id_cliente: form.id_cliente === '' ? null : Number(form.id_cliente),
      id_usuario: form.id_usuario === '' ? null : Number(form.id_usuario),
      fecha: form.fecha || null,
      hora_pedido: hora('hora_pedido'),
      hora_entrega: hora('hora_entrega'),
      hora_pago: hora('hora_pago'),
      estado: form.estado || null,
      cantidad_clientes: form.cantidad_clientes === '' ? null : form.cantidad_clientes,
      observacion: form.observacion.trim() || null,
      forma_pago: form.forma_pago || null,
      puntos_canjeados_total: form.puntos_canjeados_total === '' ? null : form.puntos_canjeados_total,
      monto_pagado: form.monto_pagado === '' ? null : form.monto_pagado,
      monto_vuelto: form.monto_vuelto === '' ? null : form.monto_vuelto,
    })
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="ID de pedido" icon={Hash} value={row.id_pedido} disabled readOnly />
        <InputField label="N° de orden" icon={Hash} value={row.numero_orden} disabled readOnly />
      </div>
      <SelectField label="Mesa" name="id_mesa" value={form.id_mesa} onChange={handleChange} options={mesaOptions} placeholder="Sin mesa" />
      <div>
        <InputField label="Cliente (ID)" icon={Users} type="number" name="id_cliente" value={form.id_cliente} onChange={handleChange} min="0" step="1" inputMode="numeric" />
        <p className="mt-1 text-xs text-base-content/60">{clienteHint}</p>
      </div>
      <SelectField label="Usuario que atendió" name="id_usuario" value={form.id_usuario} onChange={handleChange} options={usuarioOptions} placeholder="Sin usuario" />
      <InputField label="Fecha" type="date" name="fecha" value={form.fecha} onChange={handleChange} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputField label="Hora del pedido" type="time" step="1" name="hora_pedido" value={form.hora_pedido} onChange={handleChange} required />
        <InputField label="Hora de entrega" type="time" step="1" name="hora_entrega" value={form.hora_entrega} onChange={handleChange} />
        <InputField label="Hora de pago" type="time" step="1" name="hora_pago" value={form.hora_pago} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Estado" name="estado" value={form.estado} onChange={handleChange} options={estadoOptions} placeholder="Sin estado" />
        <SelectField label="Forma de pago" name="forma_pago" value={form.forma_pago} onChange={handleChange} options={pagoOptions} placeholder="Sin forma de pago" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Cantidad de clientes" type="number" name="cantidad_clientes" value={form.cantidad_clientes} onChange={handleChange} min="0" step="1" inputMode="numeric" />
        <InputField label="Puntos canjeados" type="number" name="puntos_canjeados_total" value={form.puntos_canjeados_total} onChange={handleChange} min="0" step="1" inputMode="numeric" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Monto pagado" icon={Banknote} type="number" name="monto_pagado" value={form.monto_pagado} onChange={handleChange} min="0" step="0.01" inputMode="decimal" />
        <InputField label="Monto de vuelto" icon={Banknote} type="number" name="monto_vuelto" value={form.monto_vuelto} onChange={handleChange} min="0" step="0.01" inputMode="decimal" />
      </div>
      <InputField label="Observación (opcional)" name="observacion" value={form.observacion} onChange={handleChange} maxLength={100} />
      <p className="text-xs text-base-content/60">Los montos no se recalculan automáticamente: cada tabla se edita por separado.</p>
    </form>
  )
}

export default function PedidoModal({ open, row, mesas, usuarios, clientesConocidos, saving, onClose, onSave }) {
  return (
    <SideDrawer open={open} title="Editar pedido" onClose={onClose} footer={<FormDrawerFooter formId={FORM_ID} isEdit saving={saving} onClose={onClose} />}>
      {row && <PedidoForm key={row.id_pedido} row={row} mesas={mesas} usuarios={usuarios} clientesConocidos={clientesConocidos} onSave={onSave} />}
    </SideDrawer>
  )
}
