import { eq, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { itemCategories, items } from '../db/schema'

export const categoriesHandler = {
  list: async () => {
    const db = getDb()
    return db.select().from(itemCategories).all()
  },

  create: async (data: { name: string }) => {
    const db = getDb()
    const result = db.insert(itemCategories).values({ name: data.name }).returning().get()
    return result
  },

  update: async (id: number, data: { name: string }) => {
    const db = getDb()
    const result = db
      .update(itemCategories)
      .set({ name: data.name })
      .where(eq(itemCategories.id, id))
      .returning()
      .get()
    return result
  },

  delete: async (id: number) => {
    const db = getDb()
    // Check if any items reference this category
    const itemCount = db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.categoryId, id))
      .get()
    if (itemCount && itemCount.count > 0) {
      throw new Error(
        `Cannot delete category: ${itemCount.count} item(s) still reference it. Reassign or delete those items first.`
      )
    }
    db.delete(itemCategories).where(eq(itemCategories.id, id)).run()
  }
}
