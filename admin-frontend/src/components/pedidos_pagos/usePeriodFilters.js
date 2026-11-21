// src/components/pedidos_pagos/usePeriodFilters.js
// Lógica común de las pestañas: Mes/Año consultan la BD solo cuando cambian;
// el resto de filtros se aplica en el navegador sobre las filas ya cargadas.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '../general/toastComponent'
import { sameSet } from '../../utils/asistenciasUtils'

export function usePeriodFilters({ initialRows, defaults, fetchRows, refreshKey }) {
  const toast = useToast()
  const [rows, setRows] = useState(initialRows)
  const [period, setPeriod] = useState({ meses: defaults.meses, anios: defaults.anios }) // período en memoria
  const [draft, setDraft] = useState(defaults)
  const [applied, setApplied] = useState(defaults)
  const [searching, setSearching] = useState(false)

  const applyFilters = useCallback(
    async (f) => {
      if (f.meses.length === 0 || f.anios.length === 0) {
        toast.error('Selecciona al menos un mes y un año.')
        return
      }
      if (!sameSet(f.meses, period.meses) || !sameSet(f.anios, period.anios)) {
        setSearching(true)
        try {
          setRows(await fetchRows(f.meses, f.anios))
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
    [period, fetchRows, toast],
  )

  const search = () => applyFilters(draft)
  const clear = () => {
    setDraft(defaults)
    applyFilters(defaults)
  }

  // Vuelve a leer el período cargado (después de editar)
  const reload = useCallback(async () => {
    try {
      setRows(await fetchRows(period.meses, period.anios))
    } catch (err) {
      toast.error(err.message)
    }
  }, [period, fetchRows, toast])

  // Otra pestaña guardó cambios que afectan a esta: se vuelve a leer
  const prevKey = useRef(refreshKey)
  useEffect(() => {
    if (prevKey.current !== refreshKey) {
      prevKey.current = refreshKey
      reload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  return { rows, period, draft, setDraft, applied, searching, search, clear, reload }
}
