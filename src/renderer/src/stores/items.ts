import { create } from 'zustand'
import type { Item, ItemCategory } from '@/types/models'

interface ItemStore {
  items: Item[]
  categories: ItemCategory[]
  loading: boolean
  error: string | null
  fetchItems: () => Promise<void>
  fetchCategories: () => Promise<void>
  createItem: (data: Omit<Item, 'id'>) => Promise<Item>
  updateItem: (id: number, data: Partial<Omit<Item, 'id'>>) => Promise<void>
  deleteItem: (id: number) => Promise<void>
  getItemsByCategory: (categoryId: number) => Item[]
  createCategory: (data: { name: string }) => Promise<ItemCategory>
  updateCategory: (id: number, data: { name: string }) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
}

export const useItemStore = create<ItemStore>((set, get) => ({
  items: [],
  categories: [],
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true, error: null })
    try {
      const items = await window.api.items.list()
      set({ items, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
  fetchCategories: async () => {
    try {
      const categories = await window.api.categories.list()
      set({ categories })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },
  createItem: async (data) => {
    const item = await window.api.items.create(data)
    set({ items: [...get().items, item] })
    return item
  },
  updateItem: async (id, data) => {
    const updated = await window.api.items.update(id, data)
    set({ items: get().items.map((i) => (i.id === id ? updated : i)) })
  },
  deleteItem: async (id) => {
    await window.api.items.delete(id)
    set({ items: get().items.filter((i) => i.id !== id) })
  },
  getItemsByCategory: (categoryId) => {
    return get().items.filter((i) => i.categoryId === categoryId)
  },
  createCategory: async (data) => {
    const category = await window.api.categories.create(data)
    set({ categories: [...get().categories, category] })
    return category
  },
  updateCategory: async (id, data) => {
    const updated = await window.api.categories.update(id, data)
    set({ categories: get().categories.map((c) => (c.id === id ? updated : c)) })
  },
  deleteCategory: async (id) => {
    await window.api.categories.delete(id)
    set({ categories: get().categories.filter((c) => c.id !== id) })
  }
}))
