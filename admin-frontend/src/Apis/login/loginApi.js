// src/Apis/login/loginApi.js
import { apiRequest } from '../apiClient'

export const loginRequest = (correo, password) =>
  apiRequest('/api/auth/login', { method: 'POST', body: { correo, password } })

export const logoutRequest = () => apiRequest('/api/auth/logout', { method: 'POST' })

export const meRequest = () => apiRequest('/api/auth/me')
