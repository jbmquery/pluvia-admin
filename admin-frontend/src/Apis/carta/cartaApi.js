// src/Apis/carta/cartaApi.js
import { apiRequest } from '../apiClient'

const BASE = '/api/carta'

// Carga inicial: platos, categorías y subcategorías en una sola llamada
export const getCartaInit = () => apiRequest(`${BASE}/init`)

// Platos
export const crearPlato = (body) => apiRequest(`${BASE}/platos`, { method: 'POST', body })
export const actualizarPlato = (id, body) => apiRequest(`${BASE}/platos/${id}`, { method: 'PUT', body })
export const eliminarPlato = (id) => apiRequest(`${BASE}/platos/${id}`, { method: 'DELETE' })

// Categorías
export const crearCategoria = (body) => apiRequest(`${BASE}/categorias`, { method: 'POST', body })
export const actualizarCategoria = (id, body) => apiRequest(`${BASE}/categorias/${id}`, { method: 'PUT', body })
export const eliminarCategoria = (id) => apiRequest(`${BASE}/categorias/${id}`, { method: 'DELETE' })

// Subcategorías
export const crearSubcategoria = (body) => apiRequest(`${BASE}/subcategorias`, { method: 'POST', body })
export const actualizarSubcategoria = (id, body) => apiRequest(`${BASE}/subcategorias/${id}`, { method: 'PUT', body })
export const eliminarSubcategoria = (id) => apiRequest(`${BASE}/subcategorias/${id}`, { method: 'DELETE' })
