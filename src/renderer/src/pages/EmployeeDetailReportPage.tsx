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
import type { Job, Employee } from '@/types/models'

const defaultRange = getDateRange('this-week')

export function EmployeeDetailReportPage() {
  const { navigate } = useNavigation()
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const [employeeId, setEmployeeId] = useState<string>('all')
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('this-week')
  const [dateFrom, setDateFrom] = useState(defaultRange.from)
  const [dateTo, setDateTo] = useState(defaultRange.to)

  useEffect(() => {
    window.api.employees.list().then(setEmployeesList).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const eid = employeeId && employeeId !== 'all' ? Number(employeeId) : undefined
    const promise = eid
      ? window.api.jobs.getByEmployee(eid, dateFrom, dateTo)
      : window.api.jobs.getForReport(dateFrom, dateTo)
    promise
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [employeeId, dateFrom, dateTo])

  function handleRangeChange(from: string, to: string, key: DateRangeKey) {
    setDateFrom(from)
    setDateTo(to)
    setRangeKey(key)
  }

  const selectedEmployee = employeesList.find((e) => e.id.toString() === employeeId)
  const showAll = !employeeId || employeeId === 'all'

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
          <h1 className="text-2xl font-semibold">Employee Detail Report</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {employeesList.map((e) => (
              <SelectItem key={e.id} value={e.id.toString()}>
                {e.name}
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
        <h1 className="text-xl font-bold">Employee Detail Report</h1>
        <p className="text-sm font-medium">{selectedEmployee ? selectedEmployee.name : 'All Employees'}</p>
        <p className="text-sm">
          {formatDate(dateFrom)} to {formatDate(dateTo)}
        </p>
      </div>

      {selectedEmployee && (
        <div className="rounded-md border p-4 print:border-0 print:p-0">
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Name: </span>
              <span className="font-medium">{selectedEmployee.name}</span>
            </div>
            {selectedEmployee.phone && (
              <div>
                <span className="text-muted-foreground">Phone: </span>
                <span className="font-medium">{selectedEmployee.phone}</span>
              </div>
            )}
            {selectedEmployee.machineTypeName && (
              <div>
                <span className="text-muted-foreground">Assigned Machine: </span>
                <span className="font-medium">{selectedEmployee.machineTypeName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">
          No jobs found for the selected period.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job #</TableHead>
                {showAll && <TableHead>Employee</TableHead>}
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Cooly</TableHead>
                <TableHead className="text-right">Waste</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{formatDate(j.date)}</TableCell>
                  <TableCell className="font-medium">{j.jobNumber}</TableCell>
                  {showAll && <TableCell>{j.employeeName ?? '-'}</TableCell>}
                  <TableCell>{j.customerName}</TableCell>
                  <TableCell>{j.itemName}</TableCell>
                  <TableCell>{j.machineTypeName ?? '-'}</TableCell>
                  <TableCell className="text-right">{j.quantity}</TableCell>
                  <TableCell className="text-right">{formatINR(j.rate)}</TableCell>
                  <TableCell className="text-right">{formatINR(j.amount)}</TableCell>
                  <TableCell className="text-right">{formatINR(j.cooly)}</TableCell>
                  <TableCell className="text-right">{formatINR(j.wasteAmount)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatINR(j.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={showAll ? 6 : 5}>Total ({jobs.length} jobs)</TableCell>
                <TableCell className="text-right">{totals.quantity}</TableCell>
                <TableCell />
                <TableCell className="text-right">{formatINR(totals.amount)}</TableCell>
                <TableCell className="text-right">{formatINR(totals.cooly)}</TableCell>
                <TableCell className="text-right">{formatINR(totals.wasteAmount)}</TableCell>
                <TableCell className="text-right">{formatINR(totals.totalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
