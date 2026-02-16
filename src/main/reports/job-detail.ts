import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { jobs, customers, items, itemCategories, jobMachineEntries, machineTypes } from '../db/schema'
import { createPdfDoc, addHeader, addFooter, formatINR, getStatusColor } from './pdf-helpers'

interface JobDetailParams {
  jobId: number
}

export function generateJobDetail(params: JobDetailParams): jsPDF {
  const { jobId } = params
  const db = getDb()

  // Get job with joins
  const row = db
    .select()
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(items, eq(jobs.itemId, items.id))
    .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .where(eq(jobs.id, jobId))
    .get()

  if (!row) throw new Error(`Job ${jobId} not found`)

  const job = row.jobs
  const customerName = row.customers?.name ?? '-'
  const customerPhone = row.customers?.phone ?? ''
  const customerAddress = row.customers?.address ?? ''
  const itemName = row.items?.name ?? '-'
  const itemSize = row.items?.size ?? '-'
  const categoryName = row.item_categories?.name ?? '-'

  // Get machine entries
  const entries = db
    .select()
    .from(jobMachineEntries)
    .leftJoin(machineTypes, eq(jobMachineEntries.machineTypeId, machineTypes.id))
    .where(eq(jobMachineEntries.jobId, jobId))
    .all()

  const doc = createPdfDoc()

  addHeader(doc, 'Job Detail Report')

  let y = 32

  // Job info section
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Job #: ${job.jobNumber}`, 14, y)
  const statusColor = getStatusColor(job.status)
  doc.setTextColor(...statusColor)
  doc.text(`Status: ${job.status}`, 120, y)
  doc.setTextColor(0, 0, 0)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${job.date}`, 14, y)
  y += 10

  // Customer info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Customer Information', 14, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Name: ${customerName}`, 14, y)
  if (customerPhone) { doc.text(`Phone: ${customerPhone}`, 100, y) }
  y += 5
  if (customerAddress) {
    doc.text(`Address: ${customerAddress}`, 14, y)
    y += 5
  }
  y += 5

  // Item details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Item Details', 14, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Item: ${itemName}`, 14, y)
  doc.text(`Size: ${itemSize}`, 80, y)
  doc.text(`Category: ${categoryName}`, 140, y)
  y += 10

  // Cost breakdown table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Cost Breakdown', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Value']],
    body: [
      ['Quantity', job.quantity.toString()],
      ['Rate', formatINR(job.rate)],
      ['Amount (Qty x Rate)', formatINR(job.amount)],
      ['Cooly', formatINR(job.cooly)],
      ['Waste %', `${job.wastePercentage}%`],
      ['Waste Amount', formatINR(job.wasteAmount)],
      ['Total Amount', formatINR(job.totalAmount)]
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50, halign: 'right' }
    },
    didParseCell(data) {
      if (data.row.index === 6) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 240, 240]
      }
    }
  })

  // Machine entries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let machineY = ((doc as any).lastAutoTable?.finalY ?? y + 60) + 10

  if (entries.length > 0) {
    if (machineY + 30 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      machineY = 20
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Machine Entries', 14, machineY)
    machineY += 4

    const machineBody = entries.map((entry) => {
      const e = entry.job_machine_entries
      const machineName = entry.machine_types?.name ?? 'Unknown'

      // Parse custom data
      let customDataStr = '-'
      try {
        const customData = JSON.parse(e.machineCustomData)
        if (typeof customData === 'object' && customData !== null) {
          customDataStr = Object.entries(customData)
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ')
        }
      } catch {
        customDataStr = e.machineCustomData
      }

      return [
        machineName,
        formatINR(e.cost),
        `${e.wastePercentage}%`,
        formatINR(e.wasteAmount),
        customDataStr
      ]
    })

    const totalMachineCost = entries.reduce((sum, e) => sum + e.job_machine_entries.cost, 0)
    const totalMachineWaste = entries.reduce((sum, e) => sum + e.job_machine_entries.wasteAmount, 0)

    machineBody.push([
      'TOTAL',
      formatINR(totalMachineCost),
      '',
      formatINR(totalMachineWaste),
      ''
    ])

    autoTable(doc, {
      startY: machineY,
      head: [['Machine', 'Cost', 'Waste %', 'Waste Amt', 'Custom Fields']],
      body: machineBody,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185] },
      didParseCell(data) {
        if (data.row.index === machineBody.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })
  }

  // Notes
  if (job.notes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notesY = ((doc as any).lastAutoTable?.finalY ?? machineY + 40) + 10
    if (notesY + 20 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      notesY = 20
    }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes', 14, notesY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(job.notes, 14, notesY + 5, { maxWidth: 180 })
  }

  addFooter(doc)

  return doc
}
