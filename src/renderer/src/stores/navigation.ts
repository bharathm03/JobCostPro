import { create } from 'zustand'

export type Page =
  | 'dashboard'
  | 'jobs'
  | 'job-form'
  | 'customers'
  | 'employees'
  | 'items'
  | 'machines'
  | 'reports'
  | 'report-cost-summary'
  | 'report-customer-wise'
  | 'report-machine-detail'
  | 'report-employee-detail'
  | 'report-waste'

interface NavigationState {
  currentPage: Page
  pageParams: Record<string, unknown>
  navigate: (page: Page, params?: Record<string, unknown>) => void
}

export const useNavigation = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  pageParams: {},
  navigate: (page, params = {}) => set({ currentPage: page, pageParams: params })
}))
