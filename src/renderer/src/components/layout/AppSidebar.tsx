import { useRef, useCallback } from 'react'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Package,
  Cog,
  FileText,
  Calculator
} from 'lucide-react'
import { useNavigation, type Page } from '@/stores/navigation'
import { cn } from '@/lib/utils'

const navItems: { page: Page; label: string; icon: React.ElementType; shortcut: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Alt+1' },
  { page: 'jobs', label: 'Jobs', icon: ClipboardList, shortcut: 'Alt+2' },
  { page: 'customers', label: 'Customers', icon: Users, shortcut: 'Alt+3' },
  { page: 'employees', label: 'Employees', icon: UserCog, shortcut: 'Alt+4' },
  { page: 'items', label: 'Items', icon: Package, shortcut: 'Alt+5' },
  { page: 'machines', label: 'Machines', icon: Cog, shortcut: 'Alt+6' },
  { page: 'reports', label: 'Reports', icon: FileText, shortcut: 'Alt+7' }
]

function isActivePage(currentPage: Page, page: Page): boolean {
  return (
    currentPage === page ||
    (page === 'jobs' && currentPage === 'job-form') ||
    (page === 'reports' && currentPage.startsWith('report-'))
  )
}

export function AppSidebar() {
  const { currentPage, navigate } = useNavigation()
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleNavKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const buttons = buttonRefs.current.filter(Boolean) as HTMLButtonElement[]
      const currentIndex = buttons.indexOf(e.target as HTMLButtonElement)
      if (currentIndex === -1) return

      let nextIndex: number | null = null

      switch (e.key) {
        case 'ArrowDown':
          nextIndex = (currentIndex + 1) % buttons.length
          break
        case 'ArrowUp':
          nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = buttons.length - 1
          break
        default:
          return
      }

      e.preventDefault()
      buttons[nextIndex]?.focus()
    },
    []
  )

  return (
    <aside className="flex h-full w-[220px] flex-col border-r bg-sidebar-background text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Calculator className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">JobCost Pro</span>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 p-2"
        role="navigation"
        aria-label="Main"
        onKeyDown={handleNavKeyDown}
      >
        {navItems.map(({ page, label, icon: Icon, shortcut }, index) => {
          const isActive = isActivePage(currentPage, page)
          return (
            <button
              key={page}
              ref={(el) => { buttonRefs.current[index] = el }}
              onClick={() => navigate(page)}
              tabIndex={isActive ? 0 : -1}
              title={`${label} (${shortcut})`}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{label}</span>
              <kbd className="ml-auto text-[10px] font-normal opacity-50">{shortcut}</kbd>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
