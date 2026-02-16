import { create } from 'zustand'
import type { Employee } from '@/types/models'

interface EmployeeStore {
  employees: Employee[]
  loading: boolean
  error: string | null
  fetchEmployees: () => Promise<void>
  createEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'machineTypeName'>) => Promise<Employee>
  updateEmployee: (id: number, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'machineTypeName'>>) => Promise<void>
  deleteEmployee: (id: number) => Promise<void>
}

export const useEmployeeStore = create<EmployeeStore>((set, get) => ({
  employees: [],
  loading: false,
  error: null,
  fetchEmployees: async () => {
    set({ loading: true, error: null })
    try {
      const employees = await window.api.employees.list()
      set({ employees, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
  createEmployee: async (data) => {
    const employee = await window.api.employees.create(data)
    await get().fetchEmployees()
    return employee
  },
  updateEmployee: async (id, data) => {
    await window.api.employees.update(id, data)
    await get().fetchEmployees()
  },
  deleteEmployee: async (id) => {
    await window.api.employees.delete(id)
    set({ employees: get().employees.filter((e) => e.id !== id) })
  }
}))
