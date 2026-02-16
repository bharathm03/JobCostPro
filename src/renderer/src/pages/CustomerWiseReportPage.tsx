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

export function CustomerWiseReportPage() {
  const { navigate } = useNavigation()
  const [jobs, setJobs] = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const [rangeKey, setRangeKey] = useState<DateRangeKey>('this-week')
  const [dateFrom, setDateFrom] = useState(defaultRange.from)
  const [dateTo, setDateTo] = useState(defaultRange.to)
  const [customerId, setCustomerId] = useState<string>('')

  const customer = customers.find((c) => c.id === Number(customerId)) ?? null

  useEffect(() => {
    window.api.customers.list().then(setCustomers).catch(console.error)
  }, [])

  useEffect(() => {
    if (!customerId) return
    setLoading(true)
    window.api.jobs
      .getByCustomer(Number(customerId), dateFrom, dateTo)
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customerId, dateFrom, dateTo])

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
      totalAmount: acc.totalAmount + j.totalAmount
    }),
    { quantity: 0, amount: 0, cooly: 0, wasteAmount: 0, totalAmount: 0 }
  )

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Customer-wise Report</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
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
        <h1 className="text-xl font-bold">Customer-wise Report</h1>
        {customer && <p className="text-sm">{customer.name}</p>}
        <p className="text-sm">{formatDate(dateFrom)} to {formatDate(dateTo)}</p>
      </div>

      {customer && (
        <div className="rounded-md border p-4 bg-muted/30 print:bg-transparent">
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <div><span className="font-medium">Customer:</span> {customer.name}</div>
            {customer.phone && <div><span className="font-medium">Phone:</span> {customer.phone}</div>}
            {customer.address && <div><span className="font-medium">Address:</span> {customer.address}</div>}
          </div>
        </div>
      )}

      {!customerId ? (
        <p className="text-muted-foreground">Select a customer to view the report.</p>
      ) : loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">No jobs found for this customer in the selected period.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job #</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Cooly</TableHead>
                <TableHead className="text-right">Waste</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{formatDate(j.date)}</TableCell>
                  <TableCell className="font-medium">{j.jobNumber}</TableCell>
                  <TableCell>{j.itemName}</TableCell>
                  <TableCell className="text-right">{j.quantity}</TableCell>
                  <TableCell className="text-right">{formatINR(j.rate)}</TableCell>
                  <TableCell className="text-right">{formatINR(j.amount)}</TableCell>
                  <TableCell className="text-right">{formatINR(j.cooly)}</TableCell>
                  <TableCell className="text-right">{formatINR(j.wasteAmount)}</TableCell>
                  <TableCell className="text-right font-medium">{formatINR(j.totalAmount)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      j.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : j.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {j.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={3}>Total ({jobs.length} jobs)</TableCell>
                <TableCell className="text-right">{totals.quantity}</TableCell>
                <TableCell />
                <TableCell className="text-right">{formatINR(totals.amount)}</TableCell>
                <TableCell className="text-right">{formatINR(totals.cooly)}</TableCell>
                <TableCell className="text-right">{formatINR(totals.wasteAmount)}</TableCell>
                <TableCell className="text-right">{formatINR(totals.totalAmount)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
