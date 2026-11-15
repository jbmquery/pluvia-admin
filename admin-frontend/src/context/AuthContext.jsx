// src/context/AuthContext.jsx
// Guarda al usuario de la sesión. El token vive en una cookie httpOnly (JS no puede leerlo);
// aquí solo se guardan los datos públicos del usuario que devuelve el backend.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginRequest, logoutRequest, meRequest } from '../Apis/login/loginApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  // Al cargar la app, pregunta al backend si hay una sesión activa
  useEffect(() => {
    let active = true
    meRequest()
      .then((data) => active && setUser(data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setChecking(false))
    return () => {
      active = false
    }
  }, [])

  // Si una petición protegida devuelve 401, cierra la sesión local
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (correo, password) => {
    const data = await loginRequest(correo, password)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, checking, login, logout }), [user, checking, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
