import { getDb } from '../db'
import { itemCategories } from '../db/schema'

export const categoriesHandler = {
  list: async () => {
    const db = getDb()
    return db.select().from(itemCategories).all()
  }
}
