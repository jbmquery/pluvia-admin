// src/pages/asistenciasPage.jsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import MainLayout from '../components/general/mainLayoutComponent'
import { useToast } from '../components/general/toastComponent'
import AsistenciasFiltros from '../components/asistencias/asistenciasFiltros'
import AsistenciasResultados from '../components/asistencias/asistenciasResultados'
import { getAsistenciasData, getAsistenciasInit } from '../Apis/asistencias/asistenciasApi'
import { defaultFilters, sameSet } from '../utils/asistenciasUtils'

export default function AsistenciasPage() {
  const toast = useToast()

  const [meta, setMeta] = useState(null) // hoy, años, usuarios, sedes, turnos
  const [rows, setRows] = useState([]) // asistencias del período cargado
  const [period, setPeriod] = useState({ meses: [], anios: [] }) // período que está en memoria
  const [draft, setDraft] = useState(null)
  const [applied, setApplied] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const loadInit = useCallback(async () => {
    try {
      const res = await getAsistenciasInit()
      const f = defaultFilters(res.mes, res.anio)
      setMeta({ hoy: res.hoy, anios: res.anios, usuarios: res.usuarios, sedes: res.sedes, turnos: res.turnos })
      setRows(res.asistencias)
      setPeriod({ meses: f.meses, anios: f.anios })
      setDraft(f)
      setApplied(f)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInit()
  }, [loadInit])

  // Mes/Año consultan la BD solo si cambiaron; usuario, sede, turno y estado filtran aquí mismo
  const applyFilters = useCallback(
    async (f) => {
      if (f.meses.length === 0 || f.anios.length === 0) {
        toast.error('Selecciona al menos un mes y un año.')
        return
      }
      if (!sameSet(f.meses, period.meses) || !sameSet(f.anios, period.anios)) {
        setSearching(true)
        try {
          const res = await getAsistenciasData(f.meses, f.anios)
          setRows(res.asistencias)
          setPeriod({ meses: f.meses, anios: f.anios })
        } catch (err) {
          toast.error(err.message)
          return
        } finally {
          setSearching(false)
        }
      }
      setApplied(f)
    },
    [period, toast],
  )

  const handleClear = () => {
    const f = defaultFilters(
      Number(new Date(meta.hoy + 'T00:00:00').getMonth() + 1),
      new Date(meta.hoy + 'T00:00:00').getFullYear(),
    )
    setDraft(f)
    applyFilters(f)
  }

  // Después de editar o corregir: se vuelve a leer el período cargado
  const reload = useCallback(async () => {
    try {
      const res = await getAsistenciasData(period.meses, period.anios)
      setRows(res.asistencias)
    } catch (err) {
      toast.error(err.message)
    }
  }, [period, toast])

  // Filtrado local sobre el período cargado
  const filtered = useMemo(() => {
    if (!applied) return []
    const u = new Set(applied.usuarios)
    const s = new Set(applied.sedes)
    const t = new Set(applied.turnos)
    const e = new Set(applied.estados)
    return rows.filter(
      (r) =>
        (u.size === 0 || u.has(String(r.id_usuario))) &&
        (s.size === 0 || s.has(String(r.id_sede))) &&
        (t.size === 0 || t.has(String(r.id_turno))) &&
        (e.size === 0 || e.has(r.estado_asistencia)),
    )
  }, [rows, applied])

  return (
    <MainLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Asistencias</h1>

        {loading ? (
          <div className="grid place-items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary" aria-label="Cargando" />
          </div>
        ) : error ? (
          <div role="alert" className="alert alert-error alert-soft">
            <span>{error}</span>
            <button type="button" className="btn btn-sm" onClick={() => { setLoading(true); loadInit() }}>
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <AsistenciasFiltros
              draft={draft}
              setDraft={setDraft}
              meta={meta}
              searching={searching}
              onSearch={() => applyFilters(draft)}
              onClear={handleClear}
            />
            <AsistenciasResultados rows={filtered} applied={applied} hoy={meta.hoy} meta={meta} onReload={reload} />
          </>
        )}
      </div>
    </MainLayout>
  )
}
