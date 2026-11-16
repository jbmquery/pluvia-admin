// src/components/asistencias/asistenciasResultados.jsx
import { useMemo, useState } from 'react'
import { Pencil, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../general/toastComponent'
import DataTable from '../general/dataTableComponent'
import AsistenciaModal from './asistenciaModal'
import CorregirModal from './corregirModal'
import DescargarMenu from './descargarMenu'
import { COLUMNS, DEFAULT_VISIBLE } from './asistenciasColumns'
import { actualizarAsistencia, getFaltas } from '../../Apis/asistencias/asistenciasApi'
import { MESES } from '../../utils/asistenciasUtils'

export default function AsistenciasResultados({ rows, applied, hoy, meta, onReload }) {
  const toast = useToast()
  const { user: me } = useAuth()

  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)
  const [edit, setEdit] = useState({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [corregir, setCorregir] = useState({ open: false, items: [] })
  const [checking, setChecking] = useState(false)

  const exportColumns = useMemo(() => COLUMNS.filter((c) => visibleKeys.includes(c.key)), [visibleKeys])
  const periodo = { meses: applied.meses, anios: applied.anios }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const res = await actualizarAsistencia(edit.row.id_asistencia, payload)
      toast.success(res.message)
      setEdit({ open: false, row: null })
      await onReload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCorregir = async () => {
    if (applied.meses.length !== 1 || applied.anios.length !== 1) {
      toast.error('Hay múltiples meses o años seleccionados. Corregir funciona con un solo mes y un solo año a la vez.')
      return
    }
    if (applied.usuarios.length === 0) {
      toast.error('Selecciona al menos un usuario en el filtro para poder corregir.')
      return
    }
    setChecking(true)
    try {
      const res = await getFaltas(applied.meses[0], applied.anios[0], applied.usuarios)
      const faltas = res.faltas.map((f) => ({ key: `f-${f.id_usuario}-${f.fecha}`, tipo: 'falta', ...f }))
      // Salidas sin marcar: registros visibles con entrada, sin salida y de días anteriores a hoy
      const salidas = rows
        .filter((r) => r.hora_entrada_real && !r.hora_salida_real && r.fecha < hoy && r.usuario_tipo <= me.tipo_usuario)
        .map((r) => ({
          key: `s-${r.id_asistencia}`, tipo: 'salida', id_asistencia: r.id_asistencia, id_usuario: r.id_usuario,
          apodo: r.apodo, nombres_completos: r.nombres_completos, fecha: r.fecha,
          nombre_sede: r.nombre_sede, nombre_turno: r.nombre_turno,
        }))
      const items = [...salidas, ...faltas]
      if (items.length === 0) {
        toast.info('No se encontraron salidas sin marcar ni días de falta en este período.')
        return
      }
      setCorregir({ open: true, items })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setChecking(false)
    }
  }

  const periodoTexto = `${applied.meses.map((m) => MESES[Number(m) - 1]).join(', ')} ${applied.anios.join(', ')}`

  return (
    <>
      <DataTable
        title="Asistencias"
        columns={COLUMNS}
        defaultVisible={DEFAULT_VISIBLE}
        onVisibleChange={setVisibleKeys}
        rows={rows}
        rowKey="id_asistencia"
        resetKey={applied}
        emptyText="No hay asistencias con los filtros seleccionados."
        toolbarExtra={
          <>
            <button type="button" className="btn btn-ghost border-white/10" onClick={handleCorregir} disabled={checking} aria-label="Corregir">
              {checking ? <span className="loading loading-spinner loading-sm" /> : <Wrench className="size-4" />}
              <span className="hidden sm:inline">Corregir</span>
            </button>
            <DescargarMenu rows={rows} columns={exportColumns} periodo={periodo} />
          </>
        }
        renderActions={(row) => {
          const permitido = row.usuario_tipo <= me.tipo_usuario
          return (
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                title={permitido ? 'Editar' : 'Usuario de nivel superior al tuyo'}
                aria-label="Editar"
                disabled={!permitido}
                onClick={() => setEdit({ open: true, row })}
              >
                <Pencil className="size-4" />
              </button>
            </div>
          )
        }}
      />

      <AsistenciaModal
        open={edit.open}
        row={edit.row}
        sedes={meta.sedes}
        turnos={meta.turnos}
        saving={saving}
        onClose={() => setEdit({ open: false, row: null })}
        onSave={handleSave}
      />

      <CorregirModal
        open={corregir.open}
        items={corregir.items}
        sedes={meta.sedes}
        turnos={meta.turnos}
        periodoTexto={periodoTexto}
        onClose={() => setCorregir({ open: false, items: [] })}
        onApplied={async () => {
          setCorregir({ open: false, items: [] })
          await onReload()
        }}
      />
    </>
  )
}
