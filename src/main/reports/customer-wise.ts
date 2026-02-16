import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { getDb } from '../db'
import { jobs, customers, items, itemCategories } from '../db/schema'
import { createPdfDoc, addHeader, addFooter, formatINR } from './pdf-helpers'

interface CustomerWiseParams {
  customerId: number
  dateFrom?: string
  dateTo?: string
}

export function generateCustomerWise(params: CustomerWiseParams): jsPDF {
  const { customerId, dateFrom, dateTo } = params
  const db = getDb()

  // Get customer info
  const customer = db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .get()

  const customerName = customer?.name ?? 'Unknown Customer'

  // Build conditions
  const conditions: ReturnType<typeof eq>[] = [eq(jobs.customerId, customerId)]
  if (dateFrom) conditions.push(gte(jobs.date, dateFrom))
  if (dateTo) conditions.push(lte(jobs.date, dateTo))

  // Query jobs
  const jobRows = db
    .select()
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(items, eq(jobs.itemId, items.id))
    .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .where(and(...conditions))
    .orderBy(desc(jobs.date), desc(jobs.id))
    .all()

  const doc = createPdfDoc()

  const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
  addHeader(doc, 'Customer-wise Report', dateRange)

  // Customer info
  const startY = dateRange ? 38 : 32
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Customer: ${customerName}`, 14, startY)
  if (customer?.phone) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Phone: ${customer.phone}`, 14, startY + 5)
  }
  if (customer?.address) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Address: ${customer.address}`, 14, startY + 10)
  }

  const tableStartY = startY + (customer?.address ? 16 : customer?.phone ? 11 : 6)

  // Table
  const totals = { qty: 0, amount: 0, cooly: 0, waste: 0, total: 0 }

  const tableBody = jobRows.map((row) => {
    const j = row.jobs
    totals.qty += j.quantity
    totals.amount += j.amount
    totals.cooly += j.cooly
    totals.waste += j.wasteAmount
    totals.total += j.totalAmount

    return [
      j.date,
      j.jobNumber,
      row.items?.name ?? '-',
      j.quantity.toString(),
      formatINR(j.rate),
      formatINR(j.amount),
      formatINR(j.cooly),
      formatINR(j.wasteAmount),
      formatINR(j.totalAmount),
      j.status
    ]
  })

  // Totals row
  tableBody.push([
    '', '', 'TOTALS',
    totals.qty.toString(),
    '',
    formatINR(totals.amount),
    formatINR(totals.cooly),
    formatINR(totals.waste),
    formatINR(totals.total),
    ''
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Job #', 'Item', 'Qty', 'Rate', 'Amount', 'Cooly', 'Waste', 'Total', 'Status']],
    body: tableBody,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185] },
    didParseCell(data) {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 240, 240]
      }
    }
  })

  addFooter(doc)

  return doc
}
