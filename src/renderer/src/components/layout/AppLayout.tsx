import { useNavigation } from '@/stores/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { DashboardPage } from '@/pages/DashboardPage'
import { JobListPage } from '@/pages/JobListPage'
import { JobFormPage } from '@/pages/JobFormPage'
import { CustomerListPage } from '@/pages/CustomerListPage'
import { ItemListPage } from '@/pages/ItemListPage'
import { MachineListPage } from '@/pages/MachineListPage'
import { ReportsPage } from '@/pages/ReportsPage'

const pageComponents = {
  dashboard: DashboardPage,
  jobs: JobListPage,
  'job-form': JobFormPage,
  customers: CustomerListPage,
  items: ItemListPage,
  machines: MachineListPage,
  reports: ReportsPage
} as const

export function AppLayout() {
  const { currentPage } = useNavigation()
  const PageComponent = pageComponents[currentPage]

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <PageComponent />
      </main>
    </div>
  )
}
