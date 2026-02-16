import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { getDb } from '../db'
import { jobs, customers, items, jobMachineEntries, machineTypes } from '../db/schema'
import { createPdfDoc, addHeader, addFooter, formatINR } from './pdf-helpers'

interface WasteReportParams {
  dateFrom: string
  dateTo: string
}

export function generateWasteReport(params: WasteReportParams): jsPDF {
  const { dateFrom, dateTo } = params
  const db = getDb()

  // Query jobs with machine entries in date range
  const jobRows = db
    .select()
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(items, eq(jobs.itemId, items.id))
    .where(and(gte(jobs.date, dateFrom), lte(jobs.date, dateTo)))
    .orderBy(desc(jobs.date), desc(jobs.id))
    .all()

  // Build detailed waste data
  const wasteRows: {
    jobNumber: string
    customerName: string
    itemName: string
    machineName: string
    quantity: number
    wastePercent: number
    wasteAmount: number
  }[] = []

  // Machine-wise totals
  const machineTotals: Record<string, { wasteAmount: number; count: number }> = {}

  for (const row of jobRows) {
    const entries = db
      .select()
      .from(jobMachineEntries)
      .leftJoin(machineTypes, eq(jobMachineEntries.machineTypeId, machineTypes.id))
      .where(eq(jobMachineEntries.jobId, row.jobs.id))
      .all()

    for (const entry of entries) {
      const machineName = entry.machine_types?.name ?? 'Unknown'
      wasteRows.push({
        jobNumber: row.jobs.jobNumber,
        customerName: row.customers?.name ?? '-',
        itemName: row.items?.name ?? '-',
        machineName,
        quantity: row.jobs.quantity,
        wastePercent: entry.job_machine_entries.wastePercentage,
        wasteAmount: entry.job_machine_entries.wasteAmount
      })

      if (!machineTotals[machineName]) {
        machineTotals[machineName] = { wasteAmount: 0, count: 0 }
      }
      machineTotals[machineName].wasteAmount += entry.job_machine_entries.wasteAmount
      machineTotals[machineName].count++
    }

    // Also include job-level waste if no machine entries or as an overall row
    if (entries.length === 0 && row.jobs.wasteAmount > 0) {
      wasteRows.push({
        jobNumber: row.jobs.jobNumber,
        customerName: row.customers?.name ?? '-',
        itemName: row.items?.name ?? '-',
        machineName: 'Job-level',
        quantity: row.jobs.quantity,
        wastePercent: row.jobs.wastePercentage,
        wasteAmount: row.jobs.wasteAmount
      })
    }
  }

  const doc = createPdfDoc()

  addHeader(doc, 'Waste Report', { from: dateFrom, to: dateTo })

  // Main table
  const totalWaste = wasteRows.reduce((sum, r) => sum + r.wasteAmount, 0)

  const tableBody = wasteRows.map((r) => [
    r.jobNumber,
    r.customerName,
    r.itemName,
    r.machineName,
    r.quantity.toString(),
    `${r.wastePercent.toFixed(1)}%`,
    formatINR(r.wasteAmount)
  ])

  // Add totals row
  tableBody.push([
    '', '', '', '', 'TOTAL', '', formatINR(totalWaste)
  ])

  autoTable(doc, {
    startY: 38,
    head: [['Job #', 'Customer', 'Item', 'Machine', 'Qty', 'Waste %', 'Waste Amt']],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185] },
    didParseCell(data) {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 240, 240]
      }
    }
  })

  // Machine-wise summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 100

  const summaryStartY = finalY + 10
  if (summaryStartY + 30 > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage()
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary by Machine Type', 14, 20)

    autoTable(doc, {
      startY: 26,
      head: [['Machine Type', 'Entries', 'Total Waste Amount']],
      body: Object.entries(machineTotals).map(([name, t]) => [
        name,
        t.count.toString(),
        formatINR(t.wasteAmount)
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    })
  } else {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary by Machine Type', 14, summaryStartY)

    autoTable(doc, {
      startY: summaryStartY + 6,
      head: [['Machine Type', 'Entries', 'Total Waste Amount']],
      body: Object.entries(machineTotals).map(([name, t]) => [
        name,
        t.count.toString(),
        formatINR(t.wasteAmount)
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    })
  }

  addFooter(doc)

  return doc
}
