export interface Customer {
  id: number
  name: string
  phone: string | null
  address: string | null
  createdAt: string
}

export interface Employee {
  id: number
  name: string
  phone: string | null
  machineTypeId: number | null
  createdAt: string
  machineTypeName?: string
}

export interface ItemCategory {
  id: number
  name: string
}

export interface Item {
  id: number
  name: string
  categoryId: number
  size: string
}

export interface MachineType {
  id: number
  name: string
  model: string | null
  description: string | null
  customFieldsSchema: string // JSON string
}

export interface MachineFieldSchema {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  required: boolean
  options?: string[]
}

export interface Job {
  id: number
  jobNumber: string
  date: string
  customerId: number
  employeeId?: number | null
  itemId: number
  quantity: number
  rate: number
  amount: number
  wasteAmount: number
  cooly: number
  totalAmount: number
  machineTypeId?: number | null
  machineCustomData?: string
  machineCost?: number
  machineWasteAmount?: number
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
  // Joined fields
  customerName?: string
  employeeName?: string
  itemName?: string
  itemSize?: string
  categoryName?: string
  machineTypeName?: string
}

export interface JobFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  customerId?: number
}

export interface DashboardStats {
  totalJobs: number
  totalRevenue: number
  totalCooly: number
  totalWaste: number
  recentJobs: Job[]
}
