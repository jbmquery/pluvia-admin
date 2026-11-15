// src/pages/usuariosPage.jsx
import { useCallback, useEffect, useState } from 'react'
import { Briefcase, ShieldCheck, Users } from 'lucide-react'
import MainLayout from '../components/general/mainLayoutComponent'
import UsuariosTab from '../components/usuarios/usuariosTab'
import EmpleadosTab from '../components/usuarios/empleadosTab'
import NivelesTab from '../components/usuarios/nivelesTab'
import { getUsuariosInit } from '../Apis/usuarios/usuariosApi'

const TABS = [
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'empleados', label: 'Empleados', icon: Briefcase },
  { id: 'niveles', label: 'Niveles', icon: ShieldCheck },
]

const EMPTY_DATA = { usuarios: [], empleados: [], niveles: [], sedes: [] }

export default function UsuariosPage() {
  const [tab, setTab] = useState('usuarios')
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Un solo SELECT al abrir la página; los filtros trabajan sobre estos datos en el navegador.
  // Se vuelve a llamar solo después de guardar, actualizar o eliminar.
  const load = useCallback(async () => {
    try {
      const res = await getUsuariosInit()
      setData({ usuarios: res.usuarios, empleados: res.empleados, niveles: res.niveles, sedes: res.sedes })
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <MainLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Usuarios</h1>

        <div role="tablist" className="tabs tabs-box w-full bg-base-100 sm:w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`tab flex-1 gap-2 sm:flex-none ${tab === id ? 'tab-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary" aria-label="Cargando" />
          </div>
        ) : error ? (
          <div role="alert" className="alert alert-error alert-soft">
            <span>{error}</span>
            <button type="button" className="btn btn-sm" onClick={() => { setLoading(true); load() }}>
              Reintentar
            </button>
          </div>
        ) : (
          // Los tres tabs quedan montados para conservar filtros y columnas al cambiar de pestaña
          <>
            <div className={tab === 'usuarios' ? '' : 'hidden'}>
              <UsuariosTab usuarios={data.usuarios} niveles={data.niveles} onChanged={load} />
            </div>
            <div className={tab === 'empleados' ? '' : 'hidden'}>
              <EmpleadosTab empleados={data.empleados} usuarios={data.usuarios} sedes={data.sedes} niveles={data.niveles} onChanged={load} />
            </div>
            <div className={tab === 'niveles' ? '' : 'hidden'}>
              <NivelesTab niveles={data.niveles} onChanged={load} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
