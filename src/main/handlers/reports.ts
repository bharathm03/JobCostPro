import { dialog } from 'electron'
import { writeFileSync } from 'fs'
import { generateCostSummary } from '../reports/cost-summary'
import { generateCustomerWise } from '../reports/customer-wise'
import { generateJobDetail } from '../reports/job-detail'
import { generateWasteReport } from '../reports/waste-report'

type ReportType = 'cost-summary' | 'customer-wise' | 'job-detail' | 'waste-report'

export const reportsHandler = {
  generatePDF: async (reportType: ReportType, params: Record<string, unknown>): Promise<string> => {
    let doc

    switch (reportType) {
      case 'cost-summary':
        doc = generateCostSummary({
          dateFrom: params.dateFrom as string,
          dateTo: params.dateTo as string,
          customerId: params.customerId as number | undefined
        })
        break
      case 'customer-wise':
        doc = generateCustomerWise({
          customerId: params.customerId as number,
          dateFrom: params.dateFrom as string | undefined,
          dateTo: params.dateTo as string | undefined
        })
        break
      case 'job-detail':
        doc = generateJobDetail({
          jobId: params.jobId as number
        })
        break
      case 'waste-report':
        doc = generateWasteReport({
          dateFrom: params.dateFrom as string,
          dateTo: params.dateTo as string
        })
        break
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }

    // Default filename based on report type
    const defaultName = `${reportType}-${new Date().toISOString().split('T')[0]}.pdf`

    const result = await dialog.showSaveDialog({
      title: 'Save Report',
      defaultPath: defaultName,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (result.canceled || !result.filePath) {
      return ''
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    writeFileSync(result.filePath, pdfBuffer)

    return result.filePath
  }
}
