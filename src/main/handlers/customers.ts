import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { customers } from '../db/schema'

export const customersHandler = {
  list: async () => {
    const db = getDb()
    return db.select().from(customers).orderBy(customers.name).all()
  },

  create: async (data: { name: string; phone: string | null; address: string | null }) => {
    const db = getDb()
    const result = db.insert(customers).values(data).returning().get()
    return result
  },

  update: async (
    id: number,
    data: Partial<{ name: string; phone: string | null; address: string | null }>
  ) => {
    const db = getDb()
    const result = db.update(customers).set(data).where(eq(customers.id, id)).returning().get()
    return result
  },

  delete: async (id: number) => {
    const db = getDb()
    db.delete(customers).where(eq(customers.id, id)).run()
  }
}
