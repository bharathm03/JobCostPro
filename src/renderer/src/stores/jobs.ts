import { create } from 'zustand'
import type { Job, JobFilters } from '@/types/models'

interface JobStore {
  jobs: Job[]
  loading: boolean
  error: string | null
  filters: JobFilters
  fetchJobs: (filters?: JobFilters) => Promise<void>
  createJob: (data: Omit<Job, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>) => Promise<Job>
  updateJob: (id: number, data: Partial<Omit<Job, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteJob: (id: number) => Promise<void>
  getAutoFill: (customerId: number, itemId: number) => Promise<{ rate: number; wastePercentage: number } | null>
  setFilters: (filters: JobFilters) => void
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,
  filters: {},
  fetchJobs: async (filters?) => {
    set({ loading: true, error: null })
    if (filters) set({ filters })
    try {
      const activeFilters = filters ?? get().filters
      const jobs = await window.api.jobs.list(activeFilters)
      set({ jobs, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
  createJob: async (data) => {
    const job = await window.api.jobs.create(data)
    set({ jobs: [...get().jobs, job] })
    return job
  },
  updateJob: async (id, data) => {
    const updated = await window.api.jobs.update(id, data)
    set({ jobs: get().jobs.map((j) => (j.id === id ? updated : j)) })
  },
  deleteJob: async (id) => {
    await window.api.jobs.delete(id)
    set({ jobs: get().jobs.filter((j) => j.id !== id) })
  },
  getAutoFill: async (customerId, itemId) => {
    try {
      return await window.api.jobs.getAutoFill(customerId, itemId)
    } catch {
      return null
    }
  },
  setFilters: (filters) => set({ filters })
}))
