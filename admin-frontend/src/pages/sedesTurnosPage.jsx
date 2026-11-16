// src/pages/sedesTurnosPage.jsx
import { useCallback, useEffect, useState } from 'react'
import { Building2, Clock } from 'lucide-react'
import MainLayout from '../components/general/mainLayoutComponent'
import SedesTab from '../components/sedes_turnos/sedesTab'
import TurnosTab from '../components/sedes_turnos/turnosTab'
import { getSedesTurnosInit } from '../Apis/sedesTurnos/sedesTurnosApi'

const TABS = [
  { id: 'sedes', label: 'Sedes', icon: Building2 },
  { id: 'turnos', label: 'Turnos', icon: Clock },
]

export default function SedesTurnosPage() {
  const [tab, setTab] = useState('sedes')
  const [data, setData] = useState({ sedes: [], turnos: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Un solo SELECT al abrir la página; los filtros trabajan sobre estos datos en el navegador.
  // Se vuelve a llamar solo después de guardar, actualizar o eliminar.
  const load = useCallback(async () => {
    try {
      const res = await getSedesTurnosInit()
      setData({ sedes: res.sedes, turnos: res.turnos })
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
        <h1 className="text-2xl font-extrabold sm:text-3xl">Sedes y turnos</h1>

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
          // Ambos tabs quedan montados para conservar filtros y columnas al cambiar de pestaña
          <>
            <div className={tab === 'sedes' ? '' : 'hidden'}>
              <SedesTab sedes={data.sedes} onChanged={load} />
            </div>
            <div className={tab === 'turnos' ? '' : 'hidden'}>
              <TurnosTab turnos={data.turnos} sedes={data.sedes} onChanged={load} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
