import { create } from 'zustand'

interface UIStore {
  globalLoading: boolean
  sidebarCollapsed: boolean
  setGlobalLoading: (loading: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  globalLoading: false,
  sidebarCollapsed: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed })
}))
