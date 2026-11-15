// src/Apis/apiClient.js
// Cliente HTTP compartido. Envía la cookie de sesión (httpOnly) en cada petición.
// VITE_API_URL vacío = mismo origen (usa el proxy de Vite en desarrollo).
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch', // el backend lo exige en POST/PUT/PATCH/DELETE (anti-CSRF)
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Intenta nuevamente.', 0)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* respuesta sin JSON */
  }

  if (!res.ok) {
    // Sesión vencida en un endpoint protegido (fuera de /api/auth/*)
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('auth:expired'))
    }
    throw new ApiError(data?.message || 'Ocurrió un error inesperado.', res.status, data)
  }
  return data
}
