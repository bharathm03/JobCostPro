import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CalendarIcon, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Customer, Job } from '@/types/models'

function formatDateForDisplay(date: Date | undefined): string {
  if (!date) return 'Pick a date'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function ReportsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  // Cost Summary state
  const [csFrom, setCsFrom] = useState<Date | undefined>(undefined)
  const [csTo, setCsTo] = useState<Date | undefined>(undefined)
  const [csCustomer, setCsCustomer] = useState<string>('')

  // Customer-wise state
  const [cwCustomer, setCwCustomer] = useState<string>('')
  const [cwFrom, setCwFrom] = useState<Date | undefined>(undefined)
  const [cwTo, setCwTo] = useState<Date | undefined>(undefined)

  // Job detail state
  const [jdJob, setJdJob] = useState<string>('')

  // Waste report state
  const [wrFrom, setWrFrom] = useState<Date | undefined>(undefined)
  const [wrTo, setWrTo] = useState<Date | undefined>(undefined)

  useEffect(() => {
    window.api.customers.list().then(setCustomers).catch(console.error)
    window.api.jobs.list().then(setJobs).catch(console.error)
  }, [])

  async function handleGenerate(reportType: string, params: Record<string, unknown>) {
    try {
      setLoading(reportType)
      const filePath = await window.api.reports.generatePDF(reportType, params)
      if (filePath) {
        toast.success('Report saved successfully', { description: filePath })
      } else {
        toast.info('Report generation cancelled')
      }
    } catch (err) {
      console.error('Report generation failed:', err)
      toast.error('Failed to generate report', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setLoading(null)
    }
  }

  function handleCostSummary() {
    if (!csFrom || !csTo) {
      toast.error('Please select both From and To dates')
      return
    }
    const params: Record<string, unknown> = {
      dateFrom: formatDateISO(csFrom),
      dateTo: formatDateISO(csTo)
    }
    if (csCustomer && csCustomer !== 'all') {
      params.customerId = Number(csCustomer)
    }
    handleGenerate('cost-summary', params)
  }

  function handleCustomerWise() {
    if (!cwCustomer) {
      toast.error('Please select a customer')
      return
    }
    const params: Record<string, unknown> = {
      customerId: Number(cwCustomer)
    }
    if (cwFrom) params.dateFrom = formatDateISO(cwFrom)
    if (cwTo) params.dateTo = formatDateISO(cwTo)
    handleGenerate('customer-wise', params)
  }

  function handleJobDetail() {
    if (!jdJob) {
      toast.error('Please select a job')
      return
    }
    handleGenerate('job-detail', { jobId: Number(jdJob) })
  }

  function handleWasteReport() {
    if (!wrFrom || !wrTo) {
      toast.error('Please select both From and To dates')
      return
    }
    handleGenerate('waste-report', {
      dateFrom: formatDateISO(wrFrom),
      dateTo: formatDateISO(wrTo)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export production and costing reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cost Summary Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cost Summary Report
            </CardTitle>
            <CardDescription>
              Comprehensive cost breakdown with machine-wise details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker label="From" date={csFrom} onChange={setCsFrom} />
              <DatePicker label="To" date={csTo} onChange={setCsTo} />
            </div>
            <div>
              <label className="text-sm font-medium">Customer (optional)</label>
              <Select value={csCustomer} onValueChange={setCsCustomer}>
                <SelectTrigger className="mt-1">
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
            <Button
              className="w-full"
              onClick={handleCostSummary}
              disabled={loading === 'cost-summary'}
            >
              {loading === 'cost-summary' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate PDF
            </Button>
          </CardContent>
        </Card>

        {/* Customer-wise Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Customer-wise Report
            </CardTitle>
            <CardDescription>All jobs for a specific customer with totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer</label>
              <Select value={cwCustomer} onValueChange={setCwCustomer}>
                <SelectTrigger className="mt-1">
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
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker label="From (optional)" date={cwFrom} onChange={setCwFrom} />
              <DatePicker label="To (optional)" date={cwTo} onChange={setCwTo} />
            </div>
            <Button
              className="w-full"
              onClick={handleCustomerWise}
              disabled={loading === 'customer-wise'}
            >
              {loading === 'customer-wise' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate PDF
            </Button>
          </CardContent>
        </Card>

        {/* Job Detail Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Detail Report
            </CardTitle>
            <CardDescription>
              Complete breakdown of a single job with machine entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Job</label>
              <Select value={jdJob} onValueChange={setJdJob}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id.toString()}>
                      {j.jobNumber} - {j.customerName ?? 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleJobDetail}
              disabled={loading === 'job-detail'}
            >
              {loading === 'job-detail' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate PDF
            </Button>
          </CardContent>
        </Card>

        {/* Waste Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Waste Report
            </CardTitle>
            <CardDescription>
              Waste analysis by job and machine with summary totals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker label="From" date={wrFrom} onChange={setWrFrom} />
              <DatePicker label="To" date={wrTo} onChange={setWrTo} />
            </div>
            <Button
              className="w-full"
              onClick={handleWasteReport}
              disabled={loading === 'waste-report'}
            >
              {loading === 'waste-report' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DatePicker({
  label,
  date,
  onChange
}: {
  label: string
  date: Date | undefined
  onChange: (date: Date | undefined) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'mt-1 w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateForDisplay(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
