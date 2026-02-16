import { eq, and, like, desc, gte, lte, or, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { jobs, customers, items, itemCategories, machineTypes, employees } from '../db/schema'

interface JobCreateData {
  date: string
  customerId: number
  employeeId?: number | null
  itemId: number
  quantity: number
  rate: number
  amount: number
  wastePercentage: number
  wasteAmount: number
  cooly: number
  totalAmount: number
  machineTypeId?: number | null
  machineCustomData?: string
  machineCost?: number
  machineWastePercentage?: number
  machineWasteAmount?: number
  notes: string | null
  status: string
}

interface JobFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  customerId?: number
}

function mapJobRow(row: {
  jobs: typeof jobs.$inferSelect
  customers: typeof customers.$inferSelect | null
  items: typeof items.$inferSelect | null
  item_categories: typeof itemCategories.$inferSelect | null
  employees?: typeof employees.$inferSelect | null
  machine_types?: typeof machineTypes.$inferSelect | null
}) {
  return {
    ...row.jobs,
    customerName: row.customers?.name ?? undefined,
    employeeName: row.employees?.name ?? undefined,
    itemName: row.items?.name ?? undefined,
    itemSize: row.items?.size ?? undefined,
    categoryName: row.item_categories?.name ?? undefined,
    machineTypeName: row.machine_types?.name ?? undefined
  }
}

function buildJobQuery(db: ReturnType<typeof getDb>) {
  return db
    .select()
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(employees, eq(jobs.employeeId, employees.id))
    .leftJoin(items, eq(jobs.itemId, items.id))
    .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .leftJoin(machineTypes, eq(jobs.machineTypeId, machineTypes.id))
}

export const jobsHandler = {
  list: async (filters?: JobFilters) => {
    const db = getDb()
    const conditions: ReturnType<typeof eq>[] = []

    if (filters?.status) {
      conditions.push(eq(jobs.status, filters.status))
    }
    if (filters?.dateFrom) {
      conditions.push(gte(jobs.date, filters.dateFrom))
    }
    if (filters?.dateTo) {
      conditions.push(lte(jobs.date, filters.dateTo))
    }
    if (filters?.customerId) {
      conditions.push(eq(jobs.customerId, filters.customerId))
    }

    let query = buildJobQuery(db)
      .orderBy(desc(jobs.date), desc(jobs.id))
      .$dynamic()

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`
      conditions.push(
        or(
          like(jobs.jobNumber, searchPattern),
          like(customers.name, searchPattern),
          like(items.name, searchPattern)
        )!
      )
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const rows = query.all()
    return rows.map(mapJobRow)
  },

  create: async (data: JobCreateData) => {
    const db = getDb()

    return db.transaction((tx) => {
      // Generate job number: JOB-YYYYMMDD-NNN
      const dateStr = data.date.replace(/-/g, '')
      const countResult = tx
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.date, data.date))
        .get()
      const count = (countResult?.count ?? 0) + 1
      const jobNumber = `JOB-${dateStr}-${String(count).padStart(3, '0')}`

      // Insert job with machine fields
      const newJob = tx
        .insert(jobs)
        .values({
          ...data,
          jobNumber
        })
        .returning()
        .get()

      // Return with joins
      const row = tx
        .select()
        .from(jobs)
        .leftJoin(customers, eq(jobs.customerId, customers.id))
        .leftJoin(employees, eq(jobs.employeeId, employees.id))
        .leftJoin(items, eq(jobs.itemId, items.id))
        .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
        .leftJoin(machineTypes, eq(jobs.machineTypeId, machineTypes.id))
        .where(eq(jobs.id, newJob.id))
        .get()

      if (!row) throw new Error('Failed to retrieve created job')
      return mapJobRow(row)
    })
  },

  update: async (id: number, data: Partial<JobCreateData>) => {
    const db = getDb()

    return db.transaction((tx) => {
      if (Object.keys(data).length > 0) {
        tx.update(jobs)
          .set({ ...data, updatedAt: sql`(datetime('now'))` })
          .where(eq(jobs.id, id))
          .run()
      }

      // Return with joins
      const row = tx
        .select()
        .from(jobs)
        .leftJoin(customers, eq(jobs.customerId, customers.id))
        .leftJoin(employees, eq(jobs.employeeId, employees.id))
        .leftJoin(items, eq(jobs.itemId, items.id))
        .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
        .leftJoin(machineTypes, eq(jobs.machineTypeId, machineTypes.id))
        .where(eq(jobs.id, id))
        .get()

      if (!row) throw new Error(`Job ${id} not found`)
      return mapJobRow(row)
    })
  },

  delete: async (id: number) => {
    const db = getDb()
    db.delete(jobs).where(eq(jobs.id, id)).run()
  },

  getByCustomerItem: async (customerId: number, itemId: number) => {
    const db = getDb()

    const row = db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(employees, eq(jobs.employeeId, employees.id))
      .leftJoin(items, eq(jobs.itemId, items.id))
      .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
      .leftJoin(machineTypes, eq(jobs.machineTypeId, machineTypes.id))
      .where(and(eq(jobs.customerId, customerId), eq(jobs.itemId, itemId)))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .limit(1)
      .get()

    if (!row) return null
    return mapJobRow(row)
  },

  get: async (id: number) => {
    const db = getDb()
    const row = buildJobQuery(db).where(eq(jobs.id, id)).get()
    if (!row) throw new Error(`Job ${id} not found`)
    return mapJobRow(row)
  },

  getByMachine: async (machineTypeId: number, dateFrom: string, dateTo: string) => {
    const db = getDb()
    const rows = buildJobQuery(db)
      .where(and(eq(jobs.machineTypeId, machineTypeId), gte(jobs.date, dateFrom), lte(jobs.date, dateTo)))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .all()
    return rows.map(mapJobRow)
  },

  getByEmployee: async (employeeId: number, dateFrom: string, dateTo: string) => {
    const db = getDb()
    const rows = buildJobQuery(db)
      .where(and(eq(jobs.employeeId, employeeId), gte(jobs.date, dateFrom), lte(jobs.date, dateTo)))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .all()
    return rows.map(mapJobRow)
  },

  getForReport: async (dateFrom: string, dateTo: string, customerId?: number) => {
    const db = getDb()
    const conditions = [gte(jobs.date, dateFrom), lte(jobs.date, dateTo)]

    if (customerId) {
      conditions.push(eq(jobs.customerId, customerId))
    }

    const rows = buildJobQuery(db)
      .where(and(...conditions))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .all()

    return rows.map(mapJobRow)
  },

  getByCustomer: async (customerId: number, dateFrom?: string, dateTo?: string) => {
    const db = getDb()
    const conditions: ReturnType<typeof eq>[] = [eq(jobs.customerId, customerId)]

    if (dateFrom) {
      conditions.push(gte(jobs.date, dateFrom))
    }
    if (dateTo) {
      conditions.push(lte(jobs.date, dateTo))
    }

    const rows = buildJobQuery(db)
      .where(and(...conditions))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .all()

    return rows.map(mapJobRow)
  }
}
