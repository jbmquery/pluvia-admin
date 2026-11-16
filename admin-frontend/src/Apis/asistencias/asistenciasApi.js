// src/Apis/asistencias/asistenciasApi.js
import { apiRequest } from '../apiClient'

const BASE = '/api/asistencias'

// Carga inicial: mes actual + datos para los filtros (usuarios, sedes, turnos, años)
export const getAsistenciasInit = () => apiRequest(`${BASE}/init`)

// Consulta por mes(es) y año(s). Es la única consulta que cambia al "Buscar" con otro período.
export const getAsistenciasData = (meses, anios) =>
  apiRequest(`${BASE}/data?meses=${meses.join(',')}&anios=${anios.join(',')}`)

// Días del mes (hasta ayer) en que los usuarios no tienen ninguna fila
export const getFaltas = (mes, anio, usuarios) =>
  apiRequest(`${BASE}/faltas?mes=${mes}&anio=${anio}&usuarios=${usuarios.join(',')}`)

export const corregirAsistencias = (body) => apiRequest(`${BASE}/corregir`, { method: 'POST', body })
export const actualizarAsistencia = (id, body) => apiRequest(`${BASE}/${id}`, { method: 'PUT', body })
