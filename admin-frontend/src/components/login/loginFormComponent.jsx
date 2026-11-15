// src/components/login/loginFormComponent.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import InputField from '../general/inputFieldComponent'

export default function LoginForm({ onSubmit, loading }) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ correo, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <InputField
        label="Correo"
        icon={Mail}
        type="email"
        name="correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        placeholder="tucorreo@empresa.com"
        autoComplete="username"
        disabled={loading}
      />
      <InputField
        label="Contraseña"
        icon={Lock}
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Ingresa tu contraseña"
        autoComplete="current-password"
        disabled={loading}
      />

      <div className="flex justify-end">
        <Link to="/restaurar-password" className="link link-primary text-sm">
          ¿Desea restaurar contraseña?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-lg w-full border-0 bg-linear-to-r from-amber-400 to-orange-600 text-lg font-bold text-white hover:brightness-110"
      >
        {loading && <span className="loading loading-spinner" />}
        Ingresar
      </button>
    </form>
  )
}
