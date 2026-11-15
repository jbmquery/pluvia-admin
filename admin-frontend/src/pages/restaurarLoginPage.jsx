// src/pages/restaurarLoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/general/toastComponent'
import AuthShell from '../components/general/authShellComponent'
import RestaurarForm from '../components/restaurar_login/restaurarFormComponent'
import { restaurarPasswordRequest } from '../Apis/restaurarLogin/restaurarLoginApi'

export default function RestaurarLoginPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (form) => {
    setLoading(true)
    try {
      await restaurarPasswordRequest({
        correo: form.correo.trim(),
        password_actual: form.actual,
        password_nueva: form.nueva,
        password_confirmacion: form.confirmacion,
      })
      toast.success('Contraseña actualizada. Ingresa con tu nueva contraseña.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Restaurar contraseña" subtitle="Ingresa tu contraseña anterior y elige una nueva.">
      <RestaurarForm onSubmit={handleSubmit} loading={loading} />
    </AuthShell>
  )
}
