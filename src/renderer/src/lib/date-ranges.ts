export type DateRangeKey = 'today' | 'this-week' | 'this-month' | 'last-week' | 'last-month' | 'custom'

export function getDateRange(key: Exclude<DateRangeKey, 'custom'>): { from: string; to: string; label: string } {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  switch (key) {
    case 'today':
      return { from: fmt(now), to: fmt(now), label: 'Today' }

    case 'this-week': {
      const day = now.getDay() // 0=Sun
      const mon = new Date(now)
      mon.setDate(now.getDate() - ((day + 6) % 7)) // Monday
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return { from: fmt(mon), to: fmt(sun), label: 'This Week' }
    }

    case 'this-month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { from: fmt(first), to: fmt(last), label: 'This Month' }
    }

    case 'last-week': {
      const day = now.getDay()
      const lastMon = new Date(now)
      lastMon.setDate(now.getDate() - ((day + 6) % 7) - 7)
      const lastSun = new Date(lastMon)
      lastSun.setDate(lastMon.getDate() + 6)
      return { from: fmt(lastMon), to: fmt(lastSun), label: 'Last Week' }
    }

    case 'last-month': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: fmt(first), to: fmt(last), label: 'Last Month' }
    }
  }
}
