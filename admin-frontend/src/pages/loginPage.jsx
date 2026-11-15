// src/pages/loginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/general/toastComponent'
import AuthShell from '../components/general/authShellComponent'
import LoginForm from '../components/login/loginFormComponent'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async ({ correo, password }) => {
    if (!correo.trim() || !password) {
      toast.error('Ingresa tu correo y contraseña.')
      return
    }
    setLoading(true)
    try {
      await login(correo.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message) // el backend devuelve el motivo
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Bienvenido de nuevo" subtitle="Ingresa con tu cuenta para continuar.">
      <LoginForm onSubmit={handleSubmit} loading={loading} />
    </AuthShell>
  )
}
