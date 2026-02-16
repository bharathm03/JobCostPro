import { useEffect, useState } from 'react'
import { useNavigation } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
import type { Job, MachineType, MachineFieldSchema } from '@/types/models'

const defaultRange = getDateRange('this-week')

export function MachineDetailReportPage() {
  const { navigate } = useNavigation()
  const [machines, setMachines] = useState<MachineType[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [machineSchema, setMachineSchema] = useState<MachineFieldSchema[]>([])
  const [loading, setLoading] = useState(true)

  const [machineId, setMachineId] = useState<string>('all')
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('this-week')
  const [dateFrom, setDateFrom] = useState(defaultRange.from)
  const [dateTo, setDateTo] = useState(defaultRange.to)

  useEffect(() => {
    window.api.machines.list().then(setMachines).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const mid = machineId && machineId !== 'all' ? Number(machineId) : undefined
    const jobsPromise = mid
      ? window.api.jobs.getByMachine(mid, dateFrom, dateTo)
      : window.api.jobs.getForReport(dateFrom, dateTo)
    const schemaPromise = mid
      ? window.api.machines.getSchema(mid)
      : Promise.resolve([] as MachineFieldSchema[])

    Promise.all([jobsPromise, schemaPromise])
      .then(([jobsData, schema]) => {
        setJobs(jobsData)
        setMachineSchema(schema)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [machineId, dateFrom, dateTo])

  function handleRangeChange(from: string, to: string, key: DateRangeKey) {
    setDateFrom(from)
    setDateTo(to)
    setRangeKey(key)
  }

  const selectedMachine = machines.find((m) => m.id.toString() === machineId)
  const showAll = !machineId || machineId === 'all'

  const totals = jobs.reduce(
    (acc, j) => ({
      quantity: acc.quantity + j.quantity,
      amount: acc.amount + j.amount,
      cooly: acc.cooly + j.cooly,
      wasteAmount: acc.wasteAmount + j.wasteAmount,
      machineCost: acc.machineCost + (j.machineCost ?? 0),
      totalAmount: acc.totalAmount + j.totalAmount
    }),
    { quantity: 0, amount: 0, cooly: 0, wasteAmount: 0, machineCost: 0, totalAmount: 0 }
  )

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Machine Detail Report</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <Select value={machineId} onValueChange={setMachineId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All machines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All machines</SelectItem>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id.toString()}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          rangeKey={rangeKey}
          onChange={handleRangeChange}
        />
      </div>

      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Machine Detail Report</h1>
        <p className="text-sm font-medium">{selectedMachine ? selectedMachine.name : 'All Machines'}</p>
        <p className="text-sm">
          {formatDate(dateFrom)} to {formatDate(dateTo)}
        </p>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Job #</TableHead>
                  {showAll && <TableHead>Machine</TableHead>}
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Cooly</TableHead>
                  <TableHead className="text-right">Waste</TableHead>
                  <TableHead className="text-right">Machine Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>{formatDate(j.date)}</TableCell>
                    <TableCell className="font-medium">{j.jobNumber}</TableCell>
                    {showAll && <TableCell>{j.machineTypeName ?? '-'}</TableCell>}
                    <TableCell>{j.customerName}</TableCell>
                    <TableCell>{j.itemName}</TableCell>
                    <TableCell className="text-right">{j.quantity}</TableCell>
                    <TableCell className="text-right">{formatINR(j.rate)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.amount)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.cooly)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.wasteAmount)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.machineCost ?? 0)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatINR(j.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={showAll ? 5 : 4}>Total ({jobs.length} jobs)</TableCell>
                  <TableCell className="text-right">{totals.quantity}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{formatINR(totals.amount)}</TableCell>
                  <TableCell className="text-right">{formatINR(totals.cooly)}</TableCell>
                  <TableCell className="text-right">{formatINR(totals.wasteAmount)}</TableCell>
                  <TableCell className="text-right">{formatINR(totals.machineCost)}</TableCell>
                  <TableCell className="text-right">{formatINR(totals.totalAmount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {machineSchema.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Machine Custom Fields Summary</h2>
              <div className="rounded-md border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {machineSchema.map((field) => {
                    const values = jobs
                      .map((j) => {
                        if (!j.machineCustomData) return null
                        const data = JSON.parse(j.machineCustomData) as Record<string, unknown>
                        return data[field.name]
                      })
                      .filter((v) => v != null)

                    let summary: string
                    if (field.type === 'number' && values.length > 0) {
                      const nums = values.map(Number).filter((n) => !isNaN(n))
                      const total = nums.reduce((a, b) => a + b, 0)
                      const avg = nums.length > 0 ? total / nums.length : 0
                      summary = `Total: ${total.toLocaleString('en-IN')}, Avg: ${avg.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                    } else {
                      const unique = [...new Set(values.map(String))]
                      summary = unique.length > 0 ? unique.join(', ') : '-'
                    }

                    return (
                      <div key={field.name}>
                        <p className="text-sm text-muted-foreground">{field.label}</p>
                        <p className="text-sm font-medium">{summary}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
