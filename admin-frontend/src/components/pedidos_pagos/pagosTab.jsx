// src/components/pedidos_pagos/pagosTab.jsx
import { useMemo, useState } from 'react'
import { Hash, Pencil } from 'lucide-react'
import { useToast } from '../general/toastComponent'
import FilterBlock from '../general/filterBlockComponent'
import DataTable from '../general/dataTableComponent'
import InputField from '../general/inputFieldComponent'
import SelectField from '../general/selectFieldComponent'
import DescargarExcel from '../general/descargarExcelComponent'
import PeriodoFields from './periodoFields'
import PagoModal from './pagoModal'
import { usePeriodFilters } from './usePeriodFilters'
import { formatMoney } from '../../utils/formatUtils'
import { METODOS_PAGO, cap, formatDateTimeStr, optionsFromData } from '../../utils/pedidosUtils'
import { actualizarPago, getPagos } from '../../Apis/pedidosPagos/pedidosPagosApi'

const fetchRows = async (meses, anios) => (await getPagos(meses, anios)).pagos

const COLUMNS = [
  { key: 'id_pago', label: 'ID pago' },
  { key: 'id_pedido', label: 'ID pedido' },
  { key: 'numero_orden', label: 'N° orden' },
  { key: 'semana_mes', label: 'Semana del mes', render: (r) => (r.semana_mes ? `Semana ${r.semana_mes}` : '—'), text: (r) => (r.semana_mes ? `Semana ${r.semana_mes}` : '') },
  { key: 'fecha_pago', label: 'Fecha de pago', render: (r) => formatDateTimeStr(r.fecha_pago), text: (r) => (r.fecha_pago ? formatDateTimeStr(r.fecha_pago) : '') },
  { key: 'cuenta', label: 'Cuenta' },
  { key: 'monto_total', label: 'Monto total', render: (r) => formatMoney(r.monto_total), text: (r) => Number(r.monto_total), numFmt: '0.00' },
  { key: 'metodo_pago', label: 'Método de pago', render: (r) => cap(r.metodo_pago), text: (r) => cap(r.metodo_pago) },
  { key: 'observacion', label: 'Observación' },
]
const DEFAULT_VISIBLE = ['id_pago', 'id_pedido', 'numero_orden', 'semana_mes', 'fecha_pago', 'cuenta', 'monto_total', 'metodo_pago']

export default function PagosTab({ initialRows, defaults, anios, refreshKey }) {
  const toast = useToast()
  const f = usePeriodFilters({ initialRows, defaults, fetchRows, refreshKey })
  const { rows, draft, setDraft, applied } = f

  const [edit, setEdit] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)

  const filtered = useMemo(() => {
    const sem = new Set(applied.semanas)
    const idPago = applied.idPago.trim()
    const idPed = applied.idPedido.trim()
    return rows.filter(
      (r) =>
        (sem.size === 0 || sem.has(String(r.semana_mes))) &&
        (idPago === '' || String(r.id_pago) === idPago) &&
        (idPed === '' || String(r.id_pedido) === idPed) &&
        (applied.metodo === '' || r.metodo_pago === applied.metodo),
    )
  }, [rows, applied])

  const metodoOptions = useMemo(() => optionsFromData(METODOS_PAGO, rows, 'metodo_pago'), [rows])
  const exportColumns = useMemo(() => COLUMNS.filter((c) => visibleKeys.includes(c.key)), [visibleKeys])
  const set = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }))

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const res = await actualizarPago(edit.row.id_pago, payload)
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
        <PeriodoFields draft={draft} setDraft={setDraft} anios={anios} />
        <InputField label="ID de pago" icon={Hash} type="number" name="idPago" value={draft.idPago} onChange={set} min="0" step="1" inputMode="numeric" />
        <InputField label="ID de pedido" icon={Hash} type="number" name="idPedido" value={draft.idPedido} onChange={set} min="0" step="1" inputMode="numeric" />
        <SelectField label="Método de pago" name="metodo" value={draft.metodo} onChange={set} options={metodoOptions} placeholder="Todos" />
      </FilterBlock>

      <DataTable
        title="Pagos"
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        onVisibleChange={setVisibleKeys}
        rows={filtered}
        rowKey="id_pago"
        resetKey={applied}
        emptyText="No hay pagos con los filtros seleccionados."
        toolbarExtra={<DescargarExcel rows={filtered} columns={exportColumns} sheetName="Pagos" filePrefix="pagos" />}
        renderActions={(row) => (
          <div className="flex justify-end">
            <button type="button" className="btn btn-ghost btn-circle btn-sm" title="Editar" aria-label="Editar" onClick={() => setEdit({ open: true, row })}>
              <Pencil className="size-4" />
            </button>
          </div>
        )}
      />

      <PagoModal open={edit.open} row={edit.row} saving={saving} onClose={() => setEdit({ open: false, row: null })} onSave={handleSave} />
    </div>
  )
}
