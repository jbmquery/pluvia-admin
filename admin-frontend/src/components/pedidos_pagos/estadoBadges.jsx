// src/components/pedidos_pagos/estadoBadges.jsx
import { cap } from '../../utils/pedidosUtils'

const PEDIDO = { completado: 'badge-success', cancelado: 'badge-error', inconcluso: 'badge-warning' }
const DETALLE = { pagado: 'badge-success', pendiente: 'badge-warning', cancelado: 'badge-error', perdida: 'badge-neutral' }

const Badge = ({ value, mapa }) =>
  value ? <span className={`badge badge-soft whitespace-nowrap ${mapa[value] ?? ''}`}>{cap(value)}</span> : <span className="text-base-content/50">—</span>

export const EstadoPedidoBadge = ({ value }) => <Badge value={value} mapa={PEDIDO} />
export const EstadoDetalleBadge = ({ value }) => <Badge value={value} mapa={DETALLE} />
