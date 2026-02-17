import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { ClipboardList, IndianRupee, Users, Trash2 } from 'lucide-react'
import { useNavigation } from '@/stores/navigation'
import { formatINR, formatDate } from '@/lib/format'
import { type DateRangeKey, getDateRange } from '@/lib/date-ranges'
import type { DashboardStats } from '@/types/models'

export function DashboardPage() {
  const { navigate } = useNavigation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('this-month')

  const range = getDateRange(rangeKey)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.dashboard.getStats(range.from, range.to)
      setStats(data)
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const rangeLabel =
    rangeKey === 'today'
      ? formatDate(range.from)
      : `${formatDate(range.from)} – ${formatDate(range.to)}`

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">{rangeLabel}</p>
        </div>
        <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as DateRangeKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs ?? 0}</div>
            <p className="text-xs text-muted-foreground">{range.label}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(stats?.totalRevenue ?? 0)}</div>
            <p className="text-xs text-muted-foreground">{range.label}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cooly Paid</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(stats?.totalCooly ?? 0)}</div>
            <p className="text-xs text-muted-foreground">{range.label}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(stats?.totalWaste ?? 0)}</div>
            <p className="text-xs text-muted-foreground">{range.label}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={() => window.dispatchEvent(new CustomEvent('app:new-job'))}>New Job</Button>
        <Button variant="outline" onClick={() => navigate('customers')}>
          New Customer
        </Button>
      </div>

      {/* Recent Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentJobs && stats.recentJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
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
                {stats.recentJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    interactive
                    aria-label={`Job ${job.jobNumber} - ${job.customerName ?? 'No customer'}`}
                    onClick={() => navigate('job-form', { jobId: job.id })}
                  >
                    <TableCell>{formatDate(job.date)}</TableCell>
                    <TableCell className="font-medium">{job.jobNumber}</TableCell>
                    <TableCell>{job.customerName ?? '-'}</TableCell>
                    <TableCell>{job.itemName ?? '-'}</TableCell>
                    <TableCell className="text-right">{formatINR(job.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          job.status === 'completed'
                            ? 'default'
                            : job.status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No jobs found for this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
