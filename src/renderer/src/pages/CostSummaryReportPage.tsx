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
import type { Job, Customer } from '@/types/models'

const defaultRange = getDateRange('this-week')

export function CostSummaryReportPage() {
  const { navigate } = useNavigation()
  const [jobs, setJobs] = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const [rangeKey, setRangeKey] = useState<DateRangeKey>('this-week')
  const [dateFrom, setDateFrom] = useState(defaultRange.from)
  const [dateTo, setDateTo] = useState(defaultRange.to)
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    window.api.customers.list().then(setCustomers).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const cid = customerId && customerId !== 'all' ? Number(customerId) : undefined
    window.api.jobs
      .getForReport(dateFrom, dateTo, cid)
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo, customerId])

  function handleRangeChange(from: string, to: string, key: DateRangeKey) {
    setDateFrom(from)
    setDateTo(to)
    setRangeKey(key)
  }

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

  const byCustomer = jobs.reduce<Record<string, { name: string; jobs: Job[] }>>((acc, j) => {
    const key = j.customerId.toString()
    if (!acc[key]) acc[key] = { name: j.customerName ?? 'Unknown', jobs: [] }
    acc[key].jobs.push(j)
    return acc
  }, {})

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Cost Summary Report</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          rangeKey={rangeKey}
          onChange={handleRangeChange}
        />
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Cost Summary Report</h1>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Machine</TableHead>
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
                    <TableCell>{j.customerName}</TableCell>
                    <TableCell>{j.itemName}</TableCell>
                    <TableCell>{j.machineTypeName ?? '-'}</TableCell>
                    <TableCell className="text-right">{j.quantity}</TableCell>
                    <TableCell className="text-right">{formatINR(j.rate)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.amount)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.cooly)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.wasteAmount)}</TableCell>
                    <TableCell className="text-right">{formatINR(j.machineCost ?? 0)}</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(j.totalAmount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={5}>Grand Total</TableCell>
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

          <div>
            <h2 className="mb-3 text-lg font-semibold">Customer Sub-Totals</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Cooly</TableHead>
                    <TableHead className="text-right">Waste</TableHead>
                    <TableHead className="text-right">Machine Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(byCustomer).map((group) => {
                    const sub = group.jobs.reduce(
                      (a, j) => ({
                        amount: a.amount + j.amount,
                        cooly: a.cooly + j.cooly,
                        waste: a.waste + j.wasteAmount,
                        machine: a.machine + (j.machineCost ?? 0),
                        total: a.total + j.totalAmount
                      }),
                      { amount: 0, cooly: 0, waste: 0, machine: 0, total: 0 }
                    )
                    return (
                      <TableRow key={group.name}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-right">{group.jobs.length}</TableCell>
                        <TableCell className="text-right">{formatINR(sub.amount)}</TableCell>
                        <TableCell className="text-right">{formatINR(sub.cooly)}</TableCell>
                        <TableCell className="text-right">{formatINR(sub.waste)}</TableCell>
                        <TableCell className="text-right">{formatINR(sub.machine)}</TableCell>
                        <TableCell className="text-right font-medium">{formatINR(sub.total)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
