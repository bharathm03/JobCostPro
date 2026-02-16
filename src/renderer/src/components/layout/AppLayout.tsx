import { useRef, useEffect } from 'react'
import { useNavigation } from '@/stores/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { DashboardPage } from '@/pages/DashboardPage'
import { JobListPage } from '@/pages/JobListPage'
import { JobFormPage } from '@/pages/JobFormPage'
import { CustomerListPage } from '@/pages/CustomerListPage'
import { ItemListPage } from '@/pages/ItemListPage'
import { MachineListPage } from '@/pages/MachineListPage'
import { EmployeeListPage } from '@/pages/EmployeeListPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { CostSummaryReportPage } from '@/pages/CostSummaryReportPage'
import { CustomerWiseReportPage } from '@/pages/CustomerWiseReportPage'
import { MachineDetailReportPage } from '@/pages/MachineDetailReportPage'
import { EmployeeDetailReportPage } from '@/pages/EmployeeDetailReportPage'
import { WasteReportPage } from '@/pages/WasteReportPage'

const pageComponents = {
  dashboard: DashboardPage,
  jobs: JobListPage,
  'job-form': JobFormPage,
  customers: CustomerListPage,
  employees: EmployeeListPage,
  items: ItemListPage,
  machines: MachineListPage,
  reports: ReportsPage,
  'report-cost-summary': CostSummaryReportPage,
  'report-customer-wise': CustomerWiseReportPage,
  'report-machine-detail': MachineDetailReportPage,
  'report-employee-detail': EmployeeDetailReportPage,
  'report-waste': WasteReportPage
} as const

export function AppLayout() {
  const { currentPage } = useNavigation()
  const PageComponent = pageComponents[currentPage]
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      mainRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [currentPage])

  return (
    <div className="flex h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="flex-1 overflow-y-auto p-6 outline-none"
      >
        <PageComponent />
      </main>
    </div>
  )
}
