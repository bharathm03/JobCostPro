import type {
  Customer,
  Employee,
  ItemCategory,
  Item,
  MachineType,
  MachineFieldSchema,
  Job,
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
      employees: {
        list(): Promise<Employee[]>
        create(data: Omit<Employee, 'id' | 'createdAt' | 'machineTypeName'>): Promise<Employee>
        update(id: number, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'machineTypeName'>>): Promise<Employee>
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
        create(
          data: Omit<
            Job,
            | 'id'
            | 'jobNumber'
            | 'createdAt'
            | 'updatedAt'
            | 'customerName'
            | 'employeeName'
            | 'itemName'
            | 'itemSize'
            | 'categoryName'
            | 'machineTypeName'
          >
        ): Promise<Job>
        update(
          id: number,
          data: Partial<
            Omit<
              Job,
              | 'id'
              | 'jobNumber'
              | 'createdAt'
              | 'updatedAt'
              | 'customerName'
              | 'employeeName'
              | 'itemName'
              | 'itemSize'
              | 'categoryName'
              | 'machineTypeName'
            >
          >
        ): Promise<Job>
        delete(id: number): Promise<void>
        getByCustomerItem(customerId: number, itemId: number): Promise<Job | null>
        getByMachine(machineTypeId: number, dateFrom: string, dateTo: string): Promise<Job[]>
        getByEmployee(employeeId: number, dateFrom: string, dateTo: string): Promise<Job[]>
        getForReport(dateFrom: string, dateTo: string, customerId?: number): Promise<Job[]>
        getByCustomer(customerId: number, dateFrom?: string, dateTo?: string): Promise<Job[]>
      }
      dashboard: {
        getStats(dateFrom?: string, dateTo?: string): Promise<DashboardStats>
      }
    }
  }
}
