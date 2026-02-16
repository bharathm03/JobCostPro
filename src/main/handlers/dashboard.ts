import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { jobs, customers, items, itemCategories } from '../db/schema'

export const dashboardHandler = {
  getStats: async (dateFrom?: string, dateTo?: string) => {
    const db = getDb()

    // Default to current month if no range provided
    if (!dateFrom || !dateTo) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      dateFrom = `${year}-${month}-01`
      dateTo = `${year}-${month}-31`
    }

    // Aggregate stats for date range
    const statsRow = db
      .select({
        totalJobs: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(${jobs.totalAmount}), 0)`,
        totalCooly: sql<number>`coalesce(sum(${jobs.cooly}), 0)`,
        totalWaste: sql<number>`coalesce(sum(${jobs.wasteAmount}), 0)`
      })
      .from(jobs)
      .where(and(gte(jobs.date, dateFrom), lte(jobs.date, dateTo)))
      .get()

    // Recent 10 jobs within date range
    const recentRows = db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(items, eq(jobs.itemId, items.id))
      .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
      .where(and(gte(jobs.date, dateFrom), lte(jobs.date, dateTo)))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .limit(10)
      .all()

    const recentJobs = recentRows.map((row) => ({
      ...row.jobs,
      customerName: row.customers?.name ?? undefined,
      itemName: row.items?.name ?? undefined,
      itemSize: row.items?.size ?? undefined,
      categoryName: row.item_categories?.name ?? undefined
    }))

    return {
      totalJobs: statsRow?.totalJobs ?? 0,
      totalRevenue: statsRow?.totalRevenue ?? 0,
      totalCooly: statsRow?.totalCooly ?? 0,
      totalWaste: statsRow?.totalWaste ?? 0,
      recentJobs
    }
  }
}
