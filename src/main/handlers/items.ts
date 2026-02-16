import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { items } from '../db/schema'

export const itemsHandler = {
  list: async () => {
    const db = getDb()
    return db.select().from(items).all()
  },

  create: async (data: { name: string; categoryId: number; size: string }) => {
    const db = getDb()
    return db.insert(items).values(data).returning().get()
  },

  update: async (id: number, data: Partial<{ name: string; categoryId: number; size: string }>) => {
    const db = getDb()
    return db.update(items).set(data).where(eq(items.id, id)).returning().get()
  },

  delete: async (id: number) => {
    const db = getDb()
    db.delete(items).where(eq(items.id, id)).run()
  },

  byCategory: async (categoryId: number) => {
    const db = getDb()
    return db.select().from(items).where(eq(items.categoryId, categoryId)).all()
  }
}
