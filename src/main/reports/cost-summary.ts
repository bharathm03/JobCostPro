import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { getDb } from '../db'
import { jobs, customers, items, itemCategories, jobMachineEntries, machineTypes } from '../db/schema'
import { createPdfDoc, addHeader, addFooter, formatINR } from './pdf-helpers'

interface CostSummaryParams {
  dateFrom: string
  dateTo: string
  customerId?: number
}

export function generateCostSummary(params: CostSummaryParams): jsPDF {
  const { dateFrom, dateTo, customerId } = params
  const db = getDb()

  // Build conditions
  const conditions = [gte(jobs.date, dateFrom), lte(jobs.date, dateTo)]
  if (customerId) {
    conditions.push(eq(jobs.customerId, customerId))
  }

  // Query jobs with joins
  const jobRows = db
    .select()
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(items, eq(jobs.itemId, items.id))
    .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .where(and(...conditions))
    .orderBy(desc(jobs.date), desc(jobs.id))
    .all()

  // For each job, get machine entries
  const jobsWithEntries = jobRows.map((row) => {
    const entries = db
      .select()
      .from(jobMachineEntries)
      .leftJoin(machineTypes, eq(jobMachineEntries.machineTypeId, machineTypes.id))
      .where(eq(jobMachineEntries.jobId, row.jobs.id))
      .all()

    // Build machine cost map by machine type name
    const machineCosts: Record<string, number> = {}
    for (const entry of entries) {
      const name = (entry.machine_types?.name ?? 'Unknown').toLowerCase()
      machineCosts[name] = (machineCosts[name] ?? 0) + entry.job_machine_entries.cost
    }

    return {
      job: row.jobs,
      customerName: row.customers?.name ?? '-',
      itemName: row.items?.name ?? '-',
      machineCosts
    }
  })

  const doc = createPdfDoc()

  addHeader(doc, 'Cost Summary Report', { from: dateFrom, to: dateTo })

  // Table data
  const tableHead = [
    ['Date', 'Job #', 'Customer', 'Item', 'Qty', 'Rate', 'Amount', 'Cooly', 'Waste', 'Printing', 'Cutting', 'PP', 'HM', 'Binding', 'Total']
  ]

  const totals = {
    qty: 0, rate: 0, amount: 0, cooly: 0, waste: 0,
    printing: 0, cutting: 0, pp: 0, hm: 0, binding: 0, total: 0
  }

  const tableBody = jobsWithEntries.map((row) => {
    const j = row.job
    const mc = row.machineCosts
    const printing = mc['printing'] ?? 0
    const cutting = mc['cutting'] ?? 0
    const pp = mc['pp'] ?? mc['paper pasting'] ?? 0
    const hm = mc['hm'] ?? mc['hot melt'] ?? 0
    const binding = mc['binding'] ?? 0

    totals.qty += j.quantity
    totals.amount += j.amount
    totals.cooly += j.cooly
    totals.waste += j.wasteAmount
    totals.printing += printing
    totals.cutting += cutting
    totals.pp += pp
    totals.hm += hm
    totals.binding += binding
    totals.total += j.totalAmount

    return [
      j.date,
      j.jobNumber,
      row.customerName,
      row.itemName,
      j.quantity.toString(),
      formatINR(j.rate),
      formatINR(j.amount),
      formatINR(j.cooly),
      formatINR(j.wasteAmount),
      formatINR(printing),
      formatINR(cutting),
      formatINR(pp),
      formatINR(hm),
      formatINR(binding),
      formatINR(j.totalAmount)
    ]
  })

  // Summary row
  tableBody.push([
    '', '', '', 'TOTALS',
    totals.qty.toString(),
    '',
    formatINR(totals.amount),
    formatINR(totals.cooly),
    formatINR(totals.waste),
    formatINR(totals.printing),
    formatINR(totals.cutting),
    formatINR(totals.pp),
    formatINR(totals.hm),
    formatINR(totals.binding),
    formatINR(totals.total)
  ])

  autoTable(doc, {
    startY: 38,
    head: tableHead,
    body: tableBody,
    styles: { fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 128, 185], fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 18 },
      2: { cellWidth: 20 },
      3: { cellWidth: 16 }
    },
    didParseCell(data) {
      // Bold the totals row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 240, 240]
      }
    }
  })

  // Customer-wise sub-totals section
  const customerTotals: Record<string, { jobs: number; amount: number; cooly: number; waste: number; total: number }> = {}

  for (const row of jobsWithEntries) {
    const name = row.customerName
    if (!customerTotals[name]) {
      customerTotals[name] = { jobs: 0, amount: 0, cooly: 0, waste: 0, total: 0 }
    }
    customerTotals[name].jobs++
    customerTotals[name].amount += row.job.amount
    customerTotals[name].cooly += row.job.cooly
    customerTotals[name].waste += row.job.wasteAmount
    customerTotals[name].total += row.job.totalAmount
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 100

  if (finalY + 40 > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage()
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Customer-wise Sub-Totals', 14, 20)

    autoTable(doc, {
      startY: 26,
      head: [['Customer', 'Jobs', 'Amount', 'Cooly', 'Waste', 'Total']],
      body: Object.entries(customerTotals).map(([name, t]) => [
        name,
        t.jobs.toString(),
        formatINR(t.amount),
        formatINR(t.cooly),
        formatINR(t.waste),
        formatINR(t.total)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    })
  } else {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Customer-wise Sub-Totals', 14, finalY + 10)

    autoTable(doc, {
      startY: finalY + 16,
      head: [['Customer', 'Jobs', 'Amount', 'Cooly', 'Waste', 'Total']],
      body: Object.entries(customerTotals).map(([name, t]) => [
        name,
        t.jobs.toString(),
        formatINR(t.amount),
        formatINR(t.cooly),
        formatINR(t.waste),
        formatINR(t.total)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    })
  }

  addFooter(doc)

  return doc
}
