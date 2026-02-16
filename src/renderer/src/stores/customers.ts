import { create } from 'zustand'
import type { Customer } from '@/types/models'

interface CustomerStore {
  customers: Customer[]
  loading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  createCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>
  updateCustomer: (id: number, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => Promise<void>
  deleteCustomer: (id: number) => Promise<void>
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  error: null,
  fetchCustomers: async () => {
    set({ loading: true, error: null })
    try {
      const customers = await window.api.customers.list()
      set({ customers, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
  createCustomer: async (data) => {
    const customer = await window.api.customers.create(data)
    set({ customers: [...get().customers, customer] })
    return customer
  },
  updateCustomer: async (id, data) => {
    const updated = await window.api.customers.update(id, data)
    set({ customers: get().customers.map((c) => (c.id === id ? updated : c)) })
  },
  deleteCustomer: async (id) => {
    await window.api.customers.delete(id)
    set({ customers: get().customers.filter((c) => c.id !== id) })
  }
}))
