// src/Apis/pedidosPagos/pedidosPagosApi.js
import { apiRequest } from '../apiClient'

const BASE = '/api/pedidos-pagos'
const periodo = (meses, anios) => `meses=${meses.join(',')}&anios=${anios.join(',')}`

// Carga inicial: catálogos + pedidos, detalle y pagos del mes actual
export const getPedidosPagosInit = () => apiRequest(`${BASE}/init`)

// Cada pestaña consulta su período (Mes/Año) solo cuando cambia
export const getPedidos = (meses, anios) => apiRequest(`${BASE}/pedidos?${periodo(meses, anios)}`)
export const getDetalle = (meses, anios) => apiRequest(`${BASE}/detalle?${periodo(meses, anios)}`)
export const getPagos = (meses, anios) => apiRequest(`${BASE}/pagos?${periodo(meses, anios)}`)

// Solo se edita: crear y eliminar se hace desde el otro aplicativo
export const actualizarPedido = (id, body) => apiRequest(`${BASE}/pedidos/${id}`, { method: 'PUT', body })
export const actualizarDetalle = (id, body) => apiRequest(`${BASE}/detalle/${id}`, { method: 'PUT', body })
export const actualizarPago = (id, body) => apiRequest(`${BASE}/pagos/${id}`, { method: 'PUT', body })
