// src/Apis/sedesTurnos/sedesTurnosApi.js
import { apiRequest } from '../apiClient'

const BASE = '/api/sedes-turnos'

// Carga inicial: sedes y turnos en una sola llamada
export const getSedesTurnosInit = () => apiRequest(`${BASE}/init`)

// Sedes
export const crearSede = (body) => apiRequest(`${BASE}/sedes`, { method: 'POST', body })
export const actualizarSede = (id, body) => apiRequest(`${BASE}/sedes/${id}`, { method: 'PUT', body })
export const eliminarSede = (id) => apiRequest(`${BASE}/sedes/${id}`, { method: 'DELETE' })

// Turnos
export const crearTurno = (body) => apiRequest(`${BASE}/turnos`, { method: 'POST', body })
export const actualizarTurno = (id, body) => apiRequest(`${BASE}/turnos/${id}`, { method: 'PUT', body })
export const eliminarTurno = (id) => apiRequest(`${BASE}/turnos/${id}`, { method: 'DELETE' })
