import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, CalendarIcon, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigation } from '@/stores/navigation'
import { useJobStore } from '@/stores/jobs'
import { useMachineStore } from '@/stores/machines'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'in-progress':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">In Progress</Badge>
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Completed</Badge>
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function JobListPage() {
  const { navigate, pageParams } = useNavigation()
  const { jobs, loading, fetchJobs } = useJobStore()
  const { machines, fetchMachines } = useMachineStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  // Machine selection modal state
  const [machineModalOpen, setMachineModalOpen] = useState(false)
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null)

  useEffect(() => {
    const filters: Record<string, unknown> = {}
    if (pageParams?.customerId) {
      filters.customerId = pageParams.customerId
    }
    fetchJobs(filters).catch(() => {
      toast.error('Failed to load jobs')
    })
    fetchMachines()
  }, [fetchJobs, fetchMachines, pageParams?.customerId])

  const handleNewJob = () => {
    setSelectedMachineId(null)
    setMachineModalOpen(true)
  }

  const handleMachineConfirm = () => {
    if (!selectedMachineId) {
      toast.error('Please select a machine')
      return
    }
    setMachineModalOpen(false)
    navigate('job-form', { machineTypeId: selectedMachineId })
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase()
        const matchesSearch =
          job.jobNumber.toLowerCase().includes(q) ||
          (job.customerName && job.customerName.toLowerCase().includes(q)) ||
          (job.itemName && job.itemName.toLowerCase().includes(q))
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && job.status !== statusFilter) {
        return false
      }

      // Date range filter
      if (dateFrom) {
        const jobDate = new Date(job.date)
        if (jobDate < dateFrom) return false
      }
      if (dateTo) {
        const jobDate = new Date(job.date)
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (jobDate > endOfDay) return false
      }

      return true
    })
  }, [jobs, search, statusFilter, dateFrom, dateTo])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-muted-foreground">
            Manage all production jobs and their costing details.
          </p>
        </div>
        <Button onClick={handleNewJob}>
          <Plus />
          New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[150px] justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}>
                <CalendarIcon className="size-4" />
                {dateFrom ? formatDate(dateFrom.toISOString()) : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[150px] justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}>
                <CalendarIcon className="size-4" />
                {dateTo ? formatDate(dateTo.toISOString()) : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
              />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom(undefined)
                setDateTo(undefined)
              }}
            >
              Clear dates
            </Button>
          )}
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {jobs.length === 0 ? 'No jobs found. Create your first job to get started.' : 'No jobs match your filters.'}
          </p>
          {jobs.length === 0 && (
            <Button onClick={handleNewJob}>
              <Plus />
              Create First Job
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Job #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Cooly</TableHead>
              <TableHead className="text-right">Waste</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              const rows = Array.from((e.currentTarget as HTMLElement).querySelectorAll('tr[tabindex]'))
              const idx = rows.indexOf(e.target as Element)
              if (idx === -1) return
              e.preventDefault()
              const next = e.key === 'ArrowDown' ? rows[idx + 1] : rows[idx - 1]
              ;(next as HTMLElement)?.focus()
            }
          }}>
            {filteredJobs.map((job) => (
              <TableRow
                key={job.id}
                interactive
                aria-label={`Job ${job.jobNumber} - ${job.customerName ?? 'No customer'}`}
                onClick={() => navigate('job-form', { jobId: job.id })}
              >
                <TableCell>{formatDate(job.date)}</TableCell>
                <TableCell className="font-medium">{job.jobNumber}</TableCell>
                <TableCell>{job.customerName ?? '-'}</TableCell>
                <TableCell>{job.employeeName ?? '-'}</TableCell>
                <TableCell>{job.itemName ?? '-'}</TableCell>
                <TableCell>{job.itemSize ?? '-'}</TableCell>
                <TableCell>{job.machineTypeName ?? '-'}</TableCell>
                <TableCell className="text-right">{job.quantity}</TableCell>
                <TableCell className="text-right">{formatINR(job.rate)}</TableCell>
                <TableCell className="text-right">{formatINR(job.amount)}</TableCell>
                <TableCell className="text-right">{formatINR(job.cooly)}</TableCell>
                <TableCell className="text-right">{job.wastePercentage}%</TableCell>
                <TableCell className="text-right">{formatINR(job.totalAmount)}</TableCell>
                <TableCell>{getStatusBadge(job.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Machine Selection Modal */}
      <Dialog open={machineModalOpen} onOpenChange={setMachineModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Machine</DialogTitle>
            <DialogDescription>
              Choose the machine for this job before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {machines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No machines available. Please add machines first.
              </p>
            ) : (
              machines.map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  onClick={() => setSelectedMachineId(machine.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                    selectedMachineId === machine.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border',
                      selectedMachineId === machine.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selectedMachineId === machine.id && <Check className="size-3" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{machine.name}</div>
                    {machine.model && (
                      <div className="text-xs text-muted-foreground">{machine.model}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMachineModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMachineConfirm} disabled={!selectedMachineId}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
