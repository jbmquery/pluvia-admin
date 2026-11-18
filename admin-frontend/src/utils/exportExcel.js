// src/utils/exportExcel.js
// Excel de una sola hoja con las columnas visibles. exceljs se carga solo al descargar.
import { downloadBlob, stamp } from './exportAsistencias'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function buildSimpleXlsx({ rows, columns, sheetName = 'Datos' }) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Pluvia Admin'
  wb.created = new Date()
  const ws = wb.addWorksheet(String(sheetName).replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Datos')

  // columna.text(fila) -> valor para el Excel; si no existe, se usa fila[clave]
  const value = (c, r) => (c.text ? c.text(r) : (r[c.key] ?? ''))

  ws.columns = columns.map((c) => {
    const largo = rows.reduce((max, r) => Math.max(max, String(value(c, r)).length), c.label.length)
    return { header: c.label, key: c.key, width: Math.min(Math.max(largo + 2, 10), 50), style: c.numFmt ? { numFmt: c.numFmt } : {} }
  })
  rows.forEach((r) => ws.addRow(Object.fromEntries(columns.map((c) => [c.key, value(c, r)]))))

  const head = ws.getRow(1)
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  return wb.xlsx.writeBuffer()
}

export async function exportExcel({ rows, columns, sheetName, filePrefix }) {
  const buffer = await buildSimpleXlsx({ rows, columns, sheetName })
  downloadBlob(new Blob([buffer], { type: XLSX_MIME }), `${filePrefix}_${stamp()}.xlsx`)
}
