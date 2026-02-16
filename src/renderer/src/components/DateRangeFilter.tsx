import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type DateRangeKey, getDateRange } from '@/lib/date-ranges'
import { formatDate } from '@/lib/format'

const presets: { key: Exclude<DateRangeKey, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'this-week', label: 'This Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-week', label: 'Last Week' },
  { key: 'last-month', label: 'Last Month' }
]

function formatDateForPicker(date: Date | undefined): string {
  if (!date) return 'Pick a date'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  rangeKey,
  onChange
}: {
  dateFrom: string
  dateTo: string
  rangeKey: DateRangeKey
  onChange: (from: string, to: string, key: DateRangeKey) => void
}) {
  const [customFrom, setCustomFrom] = useState<Date | undefined>(
    rangeKey === 'custom' ? new Date(dateFrom) : undefined
  )
  const [customTo, setCustomTo] = useState<Date | undefined>(
    rangeKey === 'custom' ? new Date(dateTo) : undefined
  )

  function handlePreset(key: Exclude<DateRangeKey, 'custom'>) {
    const range = getDateRange(key)
    onChange(range.from, range.to, key)
  }

  function handleCustomFrom(date: Date | undefined) {
    setCustomFrom(date)
    if (date && customTo) {
      const fmt = (d: Date) => d.toISOString().slice(0, 10)
      onChange(fmt(date), fmt(customTo), 'custom')
    }
  }

  function handleCustomTo(date: Date | undefined) {
    setCustomTo(date)
    if (customFrom && date) {
      const fmt = (d: Date) => d.toISOString().slice(0, 10)
      onChange(fmt(customFrom), fmt(date), 'custom')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {presets.map((p) => (
        <Button
          key={p.key}
          variant={rangeKey === p.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset(p.key)}
        >
          {p.label}
        </Button>
      ))}

      <div className="flex items-center gap-1 ml-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={rangeKey === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn(!customFrom && rangeKey !== 'custom' && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {rangeKey === 'custom' && customFrom ? formatDateForPicker(customFrom) : 'From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={customFrom} onSelect={handleCustomFrom} />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-sm">–</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={rangeKey === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn(!customTo && rangeKey !== 'custom' && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {rangeKey === 'custom' && customTo ? formatDateForPicker(customTo) : 'To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={customTo} onSelect={handleCustomTo} />
          </PopoverContent>
        </Popover>
      </div>

      <span className="text-sm text-muted-foreground ml-2">
        {formatDate(dateFrom)} – {formatDate(dateTo)}
      </span>
    </div>
  )
}
