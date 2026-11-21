// src/components/pedidos_pagos/detallePedidoTab.jsx
import { useMemo, useState } from 'react'
import { Hash, Pencil } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import DescargarExcel from '../general/descargarExcelComponent'
import PeriodoFields from './periodoFields'
import DetalleModal from './detalleModal'
import { EstadoDetalleBadge } from './estadoBadges'
import { usePeriodFilters } from './usePeriodFilters'
import { formatDate, formatMoney } from '../../utils/formatUtils'
import { ESTADOS_DETALLE, cap, optionsFromData } from '../../utils/pedidosUtils'
import { actualizarDetalle, getDetalle } from '../../Apis/pedidosPagos/pedidosPagosApi'

const fetchRows = async (meses, anios) => (await getDetalle(meses, anios)).detalle

const SI_NO = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]

const COLUMNS = [
  { key: 'id_detalle', label: 'ID detalle' },
  { key: 'id_pedido', label: 'ID pedido' },
  { key: 'numero_orden', label: 'N° orden' },
  { key: 'fecha_pedido', label: 'Fecha del pedido', render: (r) => formatDate(r.fecha_pedido), text: (r) => (r.fecha_pedido ? formatDate(r.fecha_pedido) : '') },
  { key: 'nombre_carta', label: 'Plato' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'precio_unitario', label: 'Precio unitario', render: (r) => formatMoney(r.precio_unitario), text: (r) => (r.precio_unitario === null ? '' : Number(r.precio_unitario)), numFmt: '0.00' },
  { key: 'es_canjeable', label: 'Es canjeable', render: (r) => (r.es_canjeable ? 'Sí' : 'No'), text: (r) => (r.es_canjeable ? 'Sí' : 'No') },
  { key: 'estado', label: 'Estado', render: (r) => <EstadoDetalleBadge value={r.estado} />, text: (r) => cap(r.estado) },
  { key: 'cuenta', label: 'Cuenta' },
  { key: 'canjeado_por', label: 'Canjeado por' },
  { key: 'id_detalle_padre', label: 'Detalle padre' },
  { key: 'observacion', label: 'Observación' },
]
const DEFAULT_VISIBLE = ['id_detalle', 'id_pedido', 'numero_orden', 'nombre_carta', 'cantidad', 'precio_unitario', 'es_canjeable', 'estado', 'cuenta']

export default function DetallePedidoTab({ initialRows, defaults, anios, carta, refreshKey }) {
  const toast = useToast()
  const f = usePeriodFilters({ initialRows, defaults, fetchRows, refreshKey })
  const { rows, draft, setDraft, applied } = f

  const [edit, setEdit] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)

  const filtered = useMemo(() => {
    const idD = applied.idDetalle.trim()
    const idP = applied.idPedido.trim()
    return rows.filter(
      (r) =>
        (idD === '' || String(r.id_detalle) === idD) &&
        (idP === '' || String(r.id_pedido) === idP) &&
        (applied.carta === '' || String(r.id_carta) === applied.carta) &&
        (applied.canjeable === '' || String(r.es_canjeable === true) === applied.canjeable) &&
        (applied.estado === '' || r.estado === applied.estado),
    )
  }, [rows, applied])

  // Plato: nombre desde la carta (JOIN por id_carta); la porción distingue platos con el mismo nombre
  const cartaOptions = useMemo(
    () =>
      carta.map((c) => ({
        value: String(c.id_carta),
        label: c.porcion ? `${c.nombre} (${c.porcion}${c.unidad_medida ? ` ${c.unidad_medida}` : ''})` : c.nombre,
      })),
    [carta],
  )
  const estadoOptions = useMemo(() => optionsFromData(ESTADOS_DETALLE, rows, 'estado'), [rows])
  const exportColumns = useMemo(() => COLUMNS.filter((c) => visibleKeys.includes(c.key)), [visibleKeys])
  const set = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const res = await actualizarDetalle(edit.row.id_detalle, payload)
      toast.success(res.message)
      setEdit({ open: false, row: null })
      await f.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <FilterBlock onSearch={f.search} onClear={f.clear} searching={f.searching}>
        <PeriodoFields draft={draft} setDraft={setDraft} anios={anios} conSemana={false} />
        <InputField label="ID de detalle" icon={Hash} type="number" name="idDetalle" value={draft.idDetalle} onChange={set} min="0" step="1" inputMode="numeric" />
        <InputField label="ID de pedido" icon={Hash} type="number" name="idPedido" value={draft.idPedido} onChange={set} min="0" step="1" inputMode="numeric" />
        <SelectField label="Plato" name="carta" value={draft.carta} onChange={set} options={cartaOptions} placeholder="Todos" />
        <SelectField label="Es canjeable" name="canjeable" value={draft.canjeable} onChange={set} options={SI_NO} placeholder="Todos" />
        <SelectField label="Estado" name="estado" value={draft.estado} onChange={set} options={estadoOptions} placeholder="Todos" />
      </FilterBlock>

      <DataTable
        title="Detalle de pedidos"
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        onVisibleChange={setVisibleKeys}
        rows={filtered}
        rowKey="id_detalle"
        resetKey={applied}
        emptyText="No hay detalles con los filtros seleccionados."
        toolbarExtra={<DescargarExcel rows={filtered} columns={exportColumns} sheetName="Detalle" filePrefix="detalle_pedidos" />}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button type="button" className="btn btn-ghost btn-circle btn-sm" title="Editar" aria-label="Editar" onClick={() => setEdit({ open: true, row })}>
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <DetalleModal
        open={edit.open}
        row={edit.row}
        cartaOptions={cartaOptions}
        saving={saving}
        onClose={() => setEdit({ open: false, row: null })}
        onSave={handleSave}
      />
    </div>
  )
}
