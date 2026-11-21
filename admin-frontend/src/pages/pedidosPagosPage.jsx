// src/pages/pedidosPagosPage.jsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, ListOrdered, Receipt } from 'lucide-react'
import MainLayout from '../components/general/mainLayoutComponent'
import PedidosTab from '../components/pedidos_pagos/pedidosTab'
import DetallePedidoTab from '../components/pedidos_pagos/detallePedidoTab'
import PagosTab from '../components/pedidos_pagos/pagosTab'
import { getPedidosPagosInit } from '../Apis/pedidosPagos/pedidosPagosApi'
import { defaultsPeriodo } from '../utils/pedidosUtils'

const TABS = [
  { id: 'pedidos', label: 'Pedidos', icon: Receipt },
  { id: 'detalle', label: 'Detalle', icon: ListOrdered },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
]

export default function PedidosPagosPage() {
  const [tab, setTab] = useState('pedidos')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0) // sube cuando se guarda un pedido: Detalle y Pagos se releen

  // Un solo SELECT al abrir la página: catálogos y el mes actual de las tres pestañas
  const load = useCallback(async () => {
    try {
      setData(await getPedidosPagosInit())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const defaults = useMemo(() => {
    if (!data) return null
    return {
      pedidos: defaultsPeriodo(data.mes, data.anio, { semanas: [], idPedido: '', mesa: '', cliente: '', usuario: '', estado: '', formaPago: '' }),
      detalle: defaultsPeriodo(data.mes, data.anio, { idDetalle: '', idPedido: '', carta: '', canjeable: '', estado: '' }),
      pagos: defaultsPeriodo(data.mes, data.anio, { semanas: [], idPago: '', idPedido: '', metodo: '' }),
    }
  }, [data])

  return (
    <MainLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Pedidos y pagos</h1>

        <div role="tablist" className="tabs tabs-box w-full bg-base-100 sm:w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`tab flex-1 gap-2 sm:flex-none ${tab === id ? 'tab-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary" aria-label="Cargando" />
          </div>
        ) : error ? (
          <div role="alert" className="alert alert-error alert-soft">
            <span>{error}</span>
            <button type="button" className="btn btn-sm" onClick={() => { setLoading(true); load() }}>
              Reintentar
            </button>
          </div>
        ) : (
          // Los tres tabs quedan montados para conservar filtros y columnas al cambiar de pestaña
          <>
            <div className={tab === 'pedidos' ? '' : 'hidden'}>
              <PedidosTab
                initialRows={data.pedidos}
                defaults={defaults.pedidos}
                anios={data.anios}
                mesas={data.mesas}
                usuarios={data.usuarios}
                onSaved={() => setVersion((v) => v + 1)}
              />
            </div>
            <div className={tab === 'detalle' ? '' : 'hidden'}>
              <DetallePedidoTab initialRows={data.detalle} defaults={defaults.detalle} anios={data.anios} carta={data.carta} refreshKey={version} />
            </div>
            <div className={tab === 'pagos' ? '' : 'hidden'}>
              <PagosTab initialRows={data.pagos} defaults={defaults.pagos} anios={data.anios} refreshKey={version} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
