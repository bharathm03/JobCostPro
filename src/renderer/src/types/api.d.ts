import type {
  Customer,
  ItemCategory,
  Item,
  MachineType,
  MachineFieldSchema,
  Job,
  JobMachineEntry,
  JobFilters,
  DashboardStats
} from './models'

export {}
declare global {
  interface Window {
    api: {
      customers: {
        list(): Promise<Customer[]>
        create(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
        update(id: number, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer>
        delete(id: number): Promise<void>
      }
      categories: {
        list(): Promise<ItemCategory[]>
      }
      items: {
        list(): Promise<Item[]>
        create(data: Omit<Item, 'id'>): Promise<Item>
        update(id: number, data: Partial<Omit<Item, 'id'>>): Promise<Item>
        delete(id: number): Promise<void>
        byCategory(categoryId: number): Promise<Item[]>
      }
      machines: {
        list(): Promise<MachineType[]>
        getSchema(machineTypeId: number): Promise<MachineFieldSchema[]>
      }
      jobs: {
        list(filters?: JobFilters): Promise<Job[]>
        create(data: {
          job: Omit<
            Job,
            | 'id'
            | 'jobNumber'
            | 'createdAt'
            | 'updatedAt'
            | 'customerName'
            | 'itemName'
            | 'itemSize'
            | 'categoryName'
          >
          machineEntries: Omit<JobMachineEntry, 'id' | 'jobId' | 'machineTypeName'>[]
        }): Promise<Job>
        update(
          id: number,
          data: {
            job: Partial<
              Omit<
                Job,
                | 'id'
                | 'jobNumber'
                | 'createdAt'
                | 'updatedAt'
                | 'customerName'
                | 'itemName'
                | 'itemSize'
                | 'categoryName'
              >
            >
            machineEntries?: Omit<JobMachineEntry, 'id' | 'jobId' | 'machineTypeName'>[]
          }
        ): Promise<Job>
        delete(id: number): Promise<void>
        getByCustomerItem(
          customerId: number,
          itemId: number
        ): Promise<{ job: Job; machineEntries: JobMachineEntry[] } | null>
        getForReport(dateFrom: string, dateTo: string, customerId?: number): Promise<Job[]>
        getByCustomer(customerId: number, dateFrom?: string, dateTo?: string): Promise<Job[]>
      }
      jobMachineEntries: {
        listByJob(jobId: number): Promise<JobMachineEntry[]>
        create(data: Omit<JobMachineEntry, 'id' | 'machineTypeName'>): Promise<JobMachineEntry>
        delete(id: number): Promise<void>
      }
      reports: {
        generatePDF(reportType: string, params: Record<string, unknown>): Promise<string>
      }
      dashboard: {
        getStats(): Promise<DashboardStats>
      }
    }
  }
}
