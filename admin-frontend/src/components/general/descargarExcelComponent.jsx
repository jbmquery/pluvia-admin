// src/components/general/descargarExcelComponent.jsx
// Botón «Descargar»: exporta a Excel las filas mostradas y solo las columnas visibles.
import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { useToast } from './toastComponent'

export default function DescargarExcel({ rows, columns, sheetName, filePrefix }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (rows.length === 0) {
      toast.error('No hay datos para descargar con los filtros actuales.')
      return
    }
    setBusy(true)
    try {
      const { exportExcel } = await import('../../utils/exportExcel')
      await exportExcel({ rows, columns, sheetName, filePrefix })
      toast.success('Descarga lista.')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo generar el archivo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className="btn btn-ghost border-white/10" onClick={run} disabled={busy} aria-label="Descargar Excel" title="Descargar Excel (.xlsx)">
      {busy ? <span className="loading loading-spinner loading-sm" /> : <FileSpreadsheet className="size-4" />}
      <span className="hidden sm:inline">Descargar</span>
    </button>
  )
}
