// src/components/asistencias/descargarMenu.jsx
import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../general/toastComponent'
import logoUrl from '../../img/loguito.png'

export default function DescargarMenu({ rows, columns, periodo }) {
  const toast = useToast()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)

  const run = async (tipo) => {
    document.activeElement?.blur() // cierra el menú
    if (rows.length === 0) {
      toast.error('No hay datos para descargar con los filtros actuales.')
      return
    }
    setBusy(true)
    try {
      const { exportXlsx, exportPdf } = await import('../../utils/exportAsistencias')
      if (tipo === 'xlsx') await exportXlsx({ rows, columns })
      else await exportPdf({ rows, columns, periodo, generadoPor: user?.apodo, logoUrl })
      toast.success('Descarga lista.')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo generar el archivo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className={`btn btn-ghost border-white/10 ${busy ? 'btn-disabled' : ''}`} aria-label="Descargar">
        {busy ? <span className="loading loading-spinner loading-sm" /> : <Download className="size-4" />}
        <span className="hidden sm:inline">Descargar</span>
      </div>
      <ul tabIndex={0} className="dropdown-content z-20 mt-2 w-52 rounded-2xl border border-white/10 bg-base-300 p-2 opacity-100 shadow-2xl">
        <li>
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-base-100" onClick={() => run('xlsx')}>
            <FileSpreadsheet className="size-4" /> Excel (.xlsx)
          </button>
        </li>
        <li>
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-base-100" onClick={() => run('pdf')}>
            <FileText className="size-4" /> PDF
          </button>
        </li>
      </ul>
    </div>
  )
}
