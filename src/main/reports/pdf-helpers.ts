import { jsPDF } from 'jspdf'

export function createPdfDoc(): jsPDF {
  return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
}

export function addHeader(doc: jsPDF, title: string, dateRange?: { from: string; to: string }): void {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Company name
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('JobCost Pro', pageWidth / 2, 15, { align: 'center' })

  // Report title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(title, pageWidth / 2, 23, { align: 'center' })

  // Date range
  if (dateRange) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text(`Period: ${dateRange.from} to ${dateRange.to}`, pageWidth / 2, 30, { align: 'center' })
  }

  // Separator line
  const lineY = dateRange ? 34 : 28
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.line(14, lineY, pageWidth - 14, lineY)
}

export function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const now = new Date().toLocaleString('en-IN')

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
    doc.text(`Generated: ${now}`, 14, pageHeight - 8)
    doc.text('JobCost Pro', pageWidth - 14, pageHeight - 8, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function getStatusColor(status: string): [number, number, number] {
  switch (status.toLowerCase()) {
    case 'completed':
      return [34, 139, 34]
    case 'in-progress':
      return [30, 144, 255]
    case 'draft':
      return [169, 169, 169]
    case 'cancelled':
      return [220, 20, 60]
    default:
      return [0, 0, 0]
  }
}
