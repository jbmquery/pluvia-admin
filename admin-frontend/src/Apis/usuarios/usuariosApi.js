// src/Apis/usuarios/usuariosApi.js
import { apiRequest } from '../apiClient'

const BASE = '/api/usuarios'

// Carga inicial: usuarios, empleados, niveles y sedes en una sola llamada
export const getUsuariosInit = () => apiRequest(`${BASE}/init`)

// Usuarios
export const crearUsuario = (body) => apiRequest(`${BASE}/usuarios`, { method: 'POST', body })
export const actualizarUsuario = (id, body) => apiRequest(`${BASE}/usuarios/${id}`, { method: 'PUT', body })
export const eliminarUsuario = (id) => apiRequest(`${BASE}/usuarios/${id}`, { method: 'DELETE' })
export const resetPasswordUsuario = (id) => apiRequest(`${BASE}/usuarios/${id}/reset-password`, { method: 'POST' })

// Empleados
export const crearEmpleado = (body) => apiRequest(`${BASE}/empleados`, { method: 'POST', body })
export const actualizarEmpleado = (id, body) => apiRequest(`${BASE}/empleados/${id}`, { method: 'PUT', body })
export const eliminarEmpleado = (id) => apiRequest(`${BASE}/empleados/${id}`, { method: 'DELETE' })

// Niveles
export const crearNivel = (body) => apiRequest(`${BASE}/niveles`, { method: 'POST', body })
export const actualizarNivel = (id, body) => apiRequest(`${BASE}/niveles/${id}`, { method: 'PUT', body })
export const eliminarNivel = (id) => apiRequest(`${BASE}/niveles/${id}`, { method: 'DELETE' })
