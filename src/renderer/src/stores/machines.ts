import { create } from 'zustand'
import type { MachineType, MachineFieldSchema } from '@/types/models'

interface MachineStore {
  machines: MachineType[]
  loading: boolean
  error: string | null
  fetchMachines: () => Promise<void>
  createMachine: (data: Omit<MachineType, 'id'>) => Promise<MachineType>
  updateMachine: (id: number, data: Partial<Omit<MachineType, 'id'>>) => Promise<void>
  deleteMachine: (id: number) => Promise<void>
  getMachineSchema: (id: number) => MachineFieldSchema[]
}

export const useMachineStore = create<MachineStore>((set, get) => ({
  machines: [],
  loading: false,
  error: null,
  fetchMachines: async () => {
    set({ loading: true, error: null })
    try {
      const machines = await window.api.machines.list()
      set({ machines, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
  createMachine: async (data) => {
    const machine = await window.api.machines.create(data)
    set({ machines: [...get().machines, machine] })
    return machine
  },
  updateMachine: async (id, data) => {
    const updated = await window.api.machines.update(id, data)
    set({ machines: get().machines.map((m) => (m.id === id ? updated : m)) })
  },
  deleteMachine: async (id) => {
    await window.api.machines.delete(id)
    set({ machines: get().machines.filter((m) => m.id !== id) })
  },
  getMachineSchema: (id) => {
    const machine = get().machines.find((m) => m.id === id)
    if (!machine) return []
    try {
      return JSON.parse(machine.customFieldsSchema) as MachineFieldSchema[]
    } catch {
      return []
    }
  }
}))
