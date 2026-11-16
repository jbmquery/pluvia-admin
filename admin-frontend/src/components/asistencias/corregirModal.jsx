// src/components/asistencias/corregirModal.jsx
// Lista salidas sin marcar y días de falta; se aplican solo los que el usuario selecciona.
import { useMemo, useState } from 'react'
import { useToast } from '../general/toastComponent'
import { formatDate } from '../../utils/formatUtils'
import { weekdayName } from '../../utils/asistenciasUtils'
import { corregirAsistencias } from '../../Apis/asistencias/asistenciasApi'

export default function CorregirModal({ open, items, sedes, turnos, periodoTexto, onClose, onApplied }) {
  if (!open) return null
  return <CorregirContenido items={items} sedes={sedes} turnos={turnos} periodoTexto={periodoTexto} onClose={onClose} onApplied={onApplied} />
}

function CorregirContenido({ items, sedes, turnos, periodoTexto, onClose, onApplied }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  // sede/turno editables solo para las faltas (la fila aún no existe)
  const [edits, setEdits] = useState(() =>
    Object.fromEntries(
      items.filter((i) => i.tipo === 'falta').map((i) => [i.key, { id_sede: i.id_sede ? String(i.id_sede) : '', id_turno: i.id_turno ? String(i.id_turno) : '' }]),
    ),
  )

  // Agrupado por usuario (apodo) y, dentro de cada grupo, fecha DESC
  const groups = useMemo(() => {
    const map = new Map()
    items.forEach((i) => {
      if (!map.has(i.id_usuario)) map.set(i.id_usuario, { id_usuario: i.id_usuario, apodo: i.apodo, nombres_completos: i.nombres_completos, items: [] })
      map.get(i.id_usuario).items.push(i)
    })
    const list = [...map.values()].sort((a, b) => a.apodo.localeCompare(b.apodo, 'es'))
    list.forEach((g) => g.items.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0)))
    return list
  }, [items])

  const numbered = useMemo(() => {
    let n = 0
    return groups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, n: ++n })) }))
  }, [groups])

  const isSelectable = (i) => i.tipo === 'salida' || Boolean(edits[i.key]?.id_turno)
  const selectable = items.filter(isSelectable)

  const toggleOne = (key) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const toggleMany = (list) =>
    setSelected((prev) => {
      const todos = list.length > 0 && list.every((i) => prev.has(i.key))
      const next = new Set(prev)
      list.forEach((i) => (todos ? next.delete(i.key) : next.add(i.key)))
      return next
    })

  const setSede = (key, id_sede) => {
    setEdits((e) => ({ ...e, [key]: { id_sede, id_turno: '' } }))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }
  const setTurno = (key, id_turno) => {
    setEdits((e) => ({ ...e, [key]: { ...e[key], id_turno } }))
    if (!id_turno)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
  }

  const apply = async () => {
    const chosen = items.filter((i) => selected.has(i.key))
    const body = {
      salidas: chosen.filter((i) => i.tipo === 'salida').map((i) => i.id_asistencia),
      faltas: chosen
        .filter((i) => i.tipo === 'falta')
        .map((i) => ({ id_usuario: i.id_usuario, fecha: i.fecha, id_sede: Number(edits[i.key].id_sede), id_turno: Number(edits[i.key].id_turno) })),
    }
    setBusy(true)
    try {
      const res = await corregirAsistencias(body)
      toast.success(res.message)
      await onApplied()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const allSelected = selectable.length > 0 && selectable.every((i) => selected.has(i.key))

  return (
    <dialog className="modal modal-open" aria-modal="true" aria-label="Corregir asistencias">
      <div className="modal-box flex max-h-[90vh] w-11/12 max-w-5xl flex-col p-0">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <h3 className="text-lg font-bold">Corregir asistencias</h3>
          <p className="mt-1 text-sm text-base-content/70">
            Período: <strong>{periodoTexto}</strong>. Marca los registros a corregir.{' '}
            <strong>Salida</strong> completa la hora de salida con la hora fin del turno. <strong>Falta</strong> crea el registro del día con estado «falta».
          </p>
        </div>

        <div className="flex-1 overflow-auto p-2 sm:p-4">
          <table className="table table-sm">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={allSelected}
                    onChange={() => toggleMany(selectable)}
                    aria-label="Seleccionar todo"
                  />
                </th>
                <th>N°</th>
                <th>Estado</th>
                <th>Día</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Sede / Turno</th>
              </tr>
            </thead>
            <tbody>
              {numbered.map((g) => {
                const sel = g.items.filter(isSelectable)
                return [
                  <tr key={`g-${g.id_usuario}`} className="bg-base-300">
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={sel.length > 0 && sel.every((i) => selected.has(i.key))}
                        disabled={sel.length === 0}
                        onChange={() => toggleMany(sel)}
                        aria-label={`Seleccionar todo de ${g.apodo}`}
                      />
                    </td>
                    <td colSpan={6} className="font-semibold">
                      {g.apodo} <span className="font-normal text-base-content/60">· {g.nombres_completos} · {g.items.length} pendiente(s)</span>
                    </td>
                  </tr>,
                  ...g.items.map((i) => (
                    <tr key={i.key} className="hover:bg-base-300/40">
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={selected.has(i.key)}
                          disabled={!isSelectable(i)}
                          onChange={() => toggleOne(i.key)}
                          title={isSelectable(i) ? undefined : 'Elige sede y turno para poder seleccionar'}
                          aria-label={`Seleccionar ${i.tipo} del ${formatDate(i.fecha)}`}
                        />
                      </td>
                      <td>{i.n}</td>
                      <td>
                        <span className={`badge badge-soft ${i.tipo === 'falta' ? 'badge-error' : 'badge-warning'}`}>{i.tipo === 'falta' ? 'Falta' : 'Salida'}</span>
                      </td>
                      <td className="whitespace-nowrap">{weekdayName(i.fecha)}</td>
                      <td className="whitespace-nowrap">{formatDate(i.fecha)}</td>
                      <td className="whitespace-nowrap">{i.apodo}</td>
                      <td>
                        {i.tipo === 'salida' ? (
                          <span className="whitespace-nowrap text-sm">{i.nombre_turno} · {i.nombre_sede}</span>
                        ) : (
                          <div className="flex min-w-64 flex-col gap-1 sm:flex-row">
                            <select
                              className="select select-sm w-full border-white/10 bg-base-300 [&>option]:bg-base-300 [&>option]:text-base-content"
                              value={edits[i.key].id_sede}
                              onChange={(e) => setSede(i.key, e.target.value)}
                              aria-label={`Sede de la falta del ${formatDate(i.fecha)}`}
                            >
                              <option value="">Sede…</option>
                              {sedes.map((s) => (
                                <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                              ))}
                            </select>
                            <select
                              className="select select-sm w-full border-white/10 bg-base-300 [&>option]:bg-base-300 [&>option]:text-base-content"
                              value={edits[i.key].id_turno}
                              onChange={(e) => setTurno(i.key, e.target.value)}
                              disabled={!edits[i.key].id_sede}
                              aria-label={`Turno de la falta del ${formatDate(i.fecha)}`}
                            >
                              <option value="">Turno…</option>
                              {turnos
                                .filter((t) => String(t.id_sede) === edits[i.key].id_sede)
                                .map((t) => (
                                  <option key={t.id_turno} value={t.id_turno}>{t.nombre_turno}</option>
                                ))}
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  )),
                ]
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-end sm:p-5">
          <span className="text-sm text-base-content/70 sm:mr-auto">Seleccionados: {selected.size} de {items.length}</span>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={apply} disabled={busy || selected.size === 0}>
            {busy && <span className="loading loading-spinner loading-sm" />}
            Aplicar corrección ({selected.size})
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={busy ? undefined : onClose} />
    </dialog>
  )
}
