import { useEffect, useState } from 'react'
import { useNavigation } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatINR, formatDate } from '@/lib/format'
import { type DateRangeKey, getDateRange } from '@/lib/date-ranges'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import type { Job } from '@/types/models'

const defaultRange = getDateRange('this-week')

export function WasteReportPage() {
  const { navigate } = useNavigation()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const [rangeKey, setRangeKey] = useState<DateRangeKey>('this-week')
  const [dateFrom, setDateFrom] = useState(defaultRange.from)
  const [dateTo, setDateTo] = useState(defaultRange.to)

  useEffect(() => {
    setLoading(true)
    window.api.jobs
      .getForReport(dateFrom, dateTo)
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo])

  function handleRangeChange(from: string, to: string, key: DateRangeKey) {
    setDateFrom(from)
    setDateTo(to)
    setRangeKey(key)
  }

  const totals = jobs.reduce(
    (acc, j) => ({
      quantity: acc.quantity + j.quantity,
      wasteAmount: acc.wasteAmount + j.wasteAmount,
      machineWasteAmount: acc.machineWasteAmount + (j.machineWasteAmount ?? 0)
    }),
    { quantity: 0, wasteAmount: 0, machineWasteAmount: 0 }
  )

  const byMachine = jobs.reduce<
    Record<string, { name: string; jobs: number; quantity: number; wasteAmount: number; machineWasteAmount: number }>
  >((acc, j) => {
    const key = j.machineTypeName ?? 'No Machine'
    if (!acc[key]) acc[key] = { name: key, jobs: 0, quantity: 0, wasteAmount: 0, machineWasteAmount: 0 }
    acc[key].jobs++
    acc[key].quantity += j.quantity
    acc[key].wasteAmount += j.wasteAmount
    acc[key].machineWasteAmount += j.machineWasteAmount ?? 0
    return acc
  }, {})

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Waste Report</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        rangeKey={rangeKey}
        onChange={handleRangeChange}
      />

      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Waste Report</h1>
        <p className="text-sm">{formatDate(dateFrom)} to {formatDate(dateTo)}</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">No jobs found for the selected period.</p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Waste Amount</TableHead>
                  <TableHead className="text-right">Machine Waste Amt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.jobNumber}</TableCell>
                    <TableCell>{j.customerName}</TableCell>
                    <TableCell>{j.itemName}</TableCell>
                    <TableCell>{j.machineTypeName ?? '-'}</TableCell>
                    <TableCell className="text-right">{j.quantity}</TableCell>
                    <TableCell className="text-right">{formatINR(j.wasteAmount)}</TableCell>
                    <TableCell className="text-right">{j.machineWasteAmount != null ? formatINR(j.machineWasteAmount) : '-'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={4}>Grand Total</TableCell>
                  <TableCell className="text-right">{totals.quantity}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{formatINR(totals.wasteAmount)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{formatINR(totals.machineWasteAmount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Machine-wise Waste Summary</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead className="text-right">Total Waste</TableHead>
                    <TableHead className="text-right">Machine Waste</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(byMachine).map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-right">{m.jobs}</TableCell>
                      <TableCell className="text-right">{m.quantity}</TableCell>
                      <TableCell className="text-right">{formatINR(m.wasteAmount)}</TableCell>
                      <TableCell className="text-right">{formatINR(m.machineWasteAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
