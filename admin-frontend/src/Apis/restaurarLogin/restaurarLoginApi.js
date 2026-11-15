// src/Apis/restaurarLogin/restaurarLoginApi.js
import { apiRequest } from '../apiClient'

export const restaurarPasswordRequest = (payload) =>
  apiRequest('/api/auth/restaurar-password', { method: 'POST', body: payload })
