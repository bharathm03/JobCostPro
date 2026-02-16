import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Cog,
  FileText,
  Calculator
} from 'lucide-react'
import { useNavigation, type Page } from '@/stores/navigation'
import { cn } from '@/lib/utils'

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'jobs', label: 'Jobs', icon: ClipboardList },
  { page: 'customers', label: 'Customers', icon: Users },
  { page: 'items', label: 'Items', icon: Package },
  { page: 'machines', label: 'Machines', icon: Cog },
  { page: 'reports', label: 'Reports', icon: FileText }
]

export function AppSidebar() {
  const { currentPage, navigate } = useNavigation()

  return (
    <aside className="flex h-full w-[220px] flex-col border-r bg-sidebar-background text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Calculator className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">JobCost Pro</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = currentPage === page || (page === 'jobs' && currentPage === 'job-form')
          return (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
