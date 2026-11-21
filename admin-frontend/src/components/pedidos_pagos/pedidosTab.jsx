// src/components/pedidos_pagos/pedidosTab.jsx
import { useMemo, useState } from 'react'
import { Hash, Pencil } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import DescargarExcel from '../general/descargarExcelComponent'
import PeriodoFields from './periodoFields'
import PedidoModal from './pedidoModal'
import { EstadoPedidoBadge } from './estadoBadges'
import { usePeriodFilters } from './usePeriodFilters'
import { formatDate, formatMoney, formatTime } from '../../utils/formatUtils'
import { ESTADOS_PEDIDO, METODOS_PAGO, cap, optionsFromData } from '../../utils/pedidosUtils'
import { actualizarPedido, getPedidos } from '../../Apis/pedidosPagos/pedidosPagosApi'

const fetchRows = async (meses, anios) => (await getPedidos(meses, anios)).pedidos

const hora = (v) => (v ? formatTime(v) : '')
const COLUMNS = [
  { key: 'id_pedido', label: 'ID pedido' },
  { key: 'numero_orden', label: 'N° orden' },
  { key: 'semana_mes', label: 'Semana del mes', render: (r) => (r.semana_mes ? `Semana ${r.semana_mes}` : '—'), text: (r) => (r.semana_mes ? `Semana ${r.semana_mes}` : '') },
  { key: 'fecha', label: 'Fecha', render: (r) => formatDate(r.fecha), text: (r) => (r.fecha ? formatDate(r.fecha) : '') },
  { key: 'nombre_mesa', label: 'Mesa' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'apodo_usuario', label: 'Usuario' },
  { key: 'hora_pedido', label: 'Hora pedido', render: (r) => formatTime(r.hora_pedido), text: (r) => hora(r.hora_pedido) },
  { key: 'hora_entrega', label: 'Hora entrega', render: (r) => formatTime(r.hora_entrega), text: (r) => hora(r.hora_entrega) },
  { key: 'hora_pago', label: 'Hora pago', render: (r) => formatTime(r.hora_pago), text: (r) => hora(r.hora_pago) },
  { key: 'estado', label: 'Estado', render: (r) => <EstadoPedidoBadge value={r.estado} />, text: (r) => cap(r.estado) },
  { key: 'forma_pago', label: 'Forma de pago', render: (r) => cap(r.forma_pago) || '—', text: (r) => cap(r.forma_pago) },
  { key: 'cantidad_clientes', label: 'Clientes' },
  { key: 'puntos_canjeados_total', label: 'Puntos canjeados' },
  { key: 'monto_pagado', label: 'Monto pagado', render: (r) => formatMoney(r.monto_pagado), text: (r) => (r.monto_pagado === null ? '' : Number(r.monto_pagado)), numFmt: '0.00' },
  { key: 'monto_vuelto', label: 'Monto vuelto', render: (r) => formatMoney(r.monto_vuelto), text: (r) => (r.monto_vuelto === null ? '' : Number(r.monto_vuelto)), numFmt: '0.00' },
  { key: 'observacion', label: 'Observación' },
]
const DEFAULT_VISIBLE = ['id_pedido', 'numero_orden', 'semana_mes', 'fecha', 'nombre_mesa', 'nombre_cliente', 'apodo_usuario', 'hora_pedido', 'estado', 'forma_pago', 'monto_pagado']

export default function PedidosTab({ initialRows, defaults, anios, mesas, usuarios, onSaved }) {
  const toast = useToast()
  const f = usePeriodFilters({ initialRows, defaults, fetchRows })
  const { rows, draft, setDraft, applied } = f

  const [edit, setEdit] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)

  // Filtrado local sobre el período cargado
  const filtered = useMemo(() => {
    const sem = new Set(applied.semanas)
    const id = applied.idPedido.trim()
    return rows.filter(
      (r) =>
        (sem.size === 0 || sem.has(String(r.semana_mes))) &&
        (id === '' || String(r.id_pedido) === id) &&
        (applied.mesa === '' || String(r.id_mesa) === applied.mesa) &&
        (applied.cliente === '' || String(r.id_cliente) === applied.cliente) &&
        (applied.usuario === '' || String(r.id_usuario) === applied.usuario) &&
        (applied.estado === '' || r.estado === applied.estado) &&
        (applied.formaPago === '' || r.forma_pago === applied.formaPago),
    )
  }, [rows, applied])

  const mesaOptions = useMemo(() => mesas.map((m) => ({ value: String(m.id_mesas), label: m.nombre })), [mesas])
  const usuarioOptions = useMemo(() => usuarios.map((u) => ({ value: String(u.id_usuario), label: `${u.nombres_completos} (${u.apodo})` })), [usuarios])
  const estadoOptions = useMemo(() => optionsFromData(ESTADOS_PEDIDO, rows, 'estado'), [rows])
  const pagoOptions = useMemo(() => optionsFromData(METODOS_PAGO, rows, 'forma_pago'), [rows])

  // Clientes del período cargado (la tabla de clientes puede ser enorme)
  const clientesConocidos = useMemo(() => {
    const m = {}
    rows.forEach((r) => {
      if (r.id_cliente) m[r.id_cliente] = r.nombre_cliente ?? `Cliente ${r.id_cliente}`
    })
    return m
  }, [rows])
  const clienteOptions = useMemo(
    () =>
      Object.entries(clientesConocidos)
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [clientesConocidos],
  )

  const exportColumns = useMemo(() => COLUMNS.filter((c) => visibleKeys.includes(c.key)), [visibleKeys])
  const set = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const res = await actualizarPedido(edit.row.id_pedido, payload)
      toast.success(res.message)
      setEdit({ open: false, row: null })
      await f.reload()
      onSaved?.() // Detalle y Pagos se vuelven a leer (la fecha del pedido pudo cambiar)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <FilterBlock onSearch={f.search} onClear={f.clear} searching={f.searching}>
        <PeriodoFields draft={draft} setDraft={setDraft} anios={anios} />
        <InputField label="ID de pedido" icon={Hash} type="number" name="idPedido" value={draft.idPedido} onChange={set} min="0" step="1" inputMode="numeric" />
        <SelectField label="Mesa" name="mesa" value={draft.mesa} onChange={set} options={mesaOptions} placeholder="Todas" />
        <SelectField label="Cliente" name="cliente" value={draft.cliente} onChange={set} options={clienteOptions} placeholder="Todos" />
        <SelectField label="Usuario" name="usuario" value={draft.usuario} onChange={set} options={usuarioOptions} placeholder="Todos" />
        <SelectField label="Estado" name="estado" value={draft.estado} onChange={set} options={estadoOptions} placeholder="Todos" />
        <SelectField label="Forma de pago" name="formaPago" value={draft.formaPago} onChange={set} options={pagoOptions} placeholder="Todas" />
      </FilterBlock>

      <DataTable
        title="Pedidos"
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        onVisibleChange={setVisibleKeys}
        rows={filtered}
        rowKey="id_pedido"
        resetKey={applied}
        emptyText="No hay pedidos con los filtros seleccionados."
        toolbarExtra={<DescargarExcel rows={filtered} columns={exportColumns} sheetName="Pedidos" filePrefix="pedidos" />}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button type="button" className="btn btn-ghost btn-circle btn-sm" title="Editar" aria-label="Editar" onClick={() => setEdit({ open: true, row })}>
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <PedidoModal
        open={edit.open}
        row={edit.row}
        mesas={mesas}
        usuarios={usuarios}
        clientesConocidos={clientesConocidos}
        saving={saving}
        onClose={() => setEdit({ open: false, row: null })}
        onSave={handleSave}
      />
    </div>
  )
}
