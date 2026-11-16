// src/utils/exportAsistencias.js
// Exporta SOLO las columnas visibles. Las librerías se cargan al descargar (import dinámico).
import { ESTADOS, MESES } from './asistenciasUtils'

const LOGO_RATIO = 434 / 562 // loguito.png: 434 x 562 px

const pad = (n) => String(n).padStart(2, '0')
export const stamp = (d = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
export const formatDateTime = (d = new Date()) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Agrupa por usuario respetando el orden recibido
export function groupByUser(rows) {
  const map = new Map()
  rows.forEach((r) => {
    if (!map.has(r.id_usuario)) {
      map.set(r.id_usuario, { id_usuario: r.id_usuario, apodo: r.apodo, nombres_completos: r.nombres_completos, rows: [] })
    }
    map.get(r.id_usuario).rows.push(r)
  })
  return [...map.values()]
}

// Contadores para el pie del reporte
export function buildSummary(rows) {
  const sum = (key) => rows.reduce((acc, r) => acc + (r[key] ?? 0), 0)
  return {
    porEstado: ESTADOS.map((e) => ({ label: e.label, n: rows.filter((r) => r.estado_asistencia === e.value).length })).filter((x) => x.n > 0),
    total: rows.length,
    tardanza: sum('minutos_tardanza'),
    extras: sum('minutos_extras'),
    sinSalida: rows.filter((r) => r.hora_entrada_real && !r.hora_salida_real).length,
    sinEntrada: rows.filter((r) => !r.hora_entrada_real).length,
  }
}

// ---------------------------------------------------------------- Excel
const sheetName = (base, used) => {
  const limpio = String(base).replace(/[\\/*?:[\]]/g, '').trim().slice(0, 31) || 'Usuario'
  let name = limpio
  let i = 2
  while (used.has(name.toLowerCase())) name = `${limpio.slice(0, 31 - String(i).length - 3)} (${i++})`
  used.add(name.toLowerCase())
  return name
}

// Un libro con una hoja por usuario
export async function buildXlsx({ rows, columns }) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Pluvia Admin'
  wb.created = new Date()
  const used = new Set()

  groupByUser(rows).forEach((g) => {
    const ws = wb.addWorksheet(sheetName(g.apodo, used))
    ws.columns = columns.map((c) => {
      const largo = Math.max(c.label.length, ...g.rows.map((r) => String(c.text(r)).length))
      return { header: c.label, key: c.key, width: Math.min(Math.max(largo + 2, 10), 50) }
    })
    g.rows.forEach((r) => ws.addRow(Object.fromEntries(columns.map((c) => [c.key, c.text(r)]))))

    const head = ws.getRow(1)
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
    head.alignment = { vertical: 'middle' }
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  })
  return wb.xlsx.writeBuffer()
}

export async function exportXlsx({ rows, columns }) {
  const buffer = await buildXlsx({ rows, columns })
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `asistencias_${stamp()}.xlsx`,
  )
}

// ---------------------------------------------------------------- PDF
export async function loadDataUrl(url) {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

// Una sección (una o más páginas) por usuario: encabezado, tabla y resumen
export async function buildPdf({ rows, columns, periodo, generadoPor, logoDataUrl, now = new Date() }) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: columns.length > 7 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 12
  const finalY = () => doc.lastAutoTable?.finalY ?? 40

  const consulta = formatDateTime(now)
  const mesTxt = periodo.meses.map((m) => MESES[Number(m) - 1]).join(', ')
  const anioTxt = periodo.anios.join(', ')

  groupByUser(rows).forEach((g, i) => {
    if (i > 0) doc.addPage()

    // Encabezado: logo + títulos
    const logoH = 22
    const logoW = logoH * LOGO_RATIO
    if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', margin, 10, logoW, logoH)
    const tx = margin + (logoDataUrl ? logoW + 6 : 0)
    doc.setFont('helvetica', 'bold').setFontSize(16).text('Reporte de asistencia', tx, 18)
    doc.setFontSize(12).text(g.nombres_completos, tx, 25)
    doc.setFont('helvetica', 'normal').setFontSize(9).text(`Usuario: ${g.apodo}`, tx, 31)

    // Datos de la consulta
    const sedes = [...new Set(g.rows.map((r) => r.nombre_sede))].join(', ')
    autoTable(doc, {
      startY: 36,
      theme: 'plain',
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 36 }, 2: { fontStyle: 'bold', cellWidth: 22 } },
      body: [
        ['Fecha de consulta', consulta, 'Mes', mesTxt],
        ['Sede(s)', sedes, 'Año', anioTxt],
      ],
    })

    // Tabla de asistencia (solo columnas visibles)
    autoTable(doc, {
      startY: finalY() + 3,
      margin: { left: margin, right: margin },
      head: [columns.map((c) => c.label)],
      body: g.rows.map((r) => columns.map((c) => String(c.text(r)))),
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 244, 252] },
    })

    // Resumen: contadores por estado y totales
    const s = buildSummary(g.rows)
    autoTable(doc, {
      startY: finalY() + 6,
      margin: { left: margin, right: margin },
      tableWidth: 95,
      head: [['Resumen', 'Cantidad']],
      body: [
        ...s.porEstado.map((e) => [e.label, String(e.n)]),
        ['Total de registros', String(s.total)],
        ['Total minutos de tardanza', String(s.tardanza)],
        ['Total minutos extras', String(s.extras)],
        ['Registros sin entrada marcada', String(s.sinEntrada)],
        ['Registros sin salida marcada', String(s.sinSalida)],
      ],
      styles: { fontSize: 9, cellPadding: 1.6 },
      headStyles: { fillColor: [31, 31, 66], textColor: 255 },
      columnStyles: { 1: { halign: 'right', cellWidth: 25 } },
      didParseCell: (d) => {
        if (d.section === 'body' && d.row.index >= s.porEstado.length) d.cell.styles.fontStyle = 'bold'
      },
    })
  })

  // Pie de página
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(120)
    doc.text(`Generado por ${generadoPor ?? '-'} el ${consulta}`, margin, pageH - 6)
    doc.text(`Página ${p} de ${total}`, pageW - margin, pageH - 6, { align: 'right' })
  }
  return doc
}

export async function exportPdf({ rows, columns, periodo, generadoPor, logoUrl }) {
  let logoDataUrl = null
  try {
    logoDataUrl = await loadDataUrl(logoUrl)
  } catch {
    /* si el logo no carga, el reporte se genera igual */
  }
  const doc = await buildPdf({ rows, columns, periodo, generadoPor, logoDataUrl })
  doc.save(`asistencias_${stamp()}.pdf`)
}
