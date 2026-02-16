import { eq, and, like, desc, gte, lte, or, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { jobs, customers, items, itemCategories, jobMachineEntries, machineTypes } from '../db/schema'

interface JobCreateData {
  date: string
  customerId: number
  itemId: number
  quantity: number
  rate: number
  amount: number
  wastePercentage: number
  wasteAmount: number
  cooly: number
  totalAmount: number
  notes: string | null
  status: string
}

interface MachineEntryData {
  machineTypeId: number
  machineCustomData: string
  cost: number
  wastePercentage: number
  wasteAmount: number
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
}) {
  return {
    ...row.jobs,
    customerName: row.customers?.name ?? undefined,
    itemName: row.items?.name ?? undefined,
    itemSize: row.items?.size ?? undefined,
    categoryName: row.item_categories?.name ?? undefined
  }
}

function getJobWithJoins(db: ReturnType<typeof getDb>, jobId: number) {
  const row = db
    .select()
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(items, eq(jobs.itemId, items.id))
    .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .where(eq(jobs.id, jobId))
    .get()

  if (!row) throw new Error(`Job ${jobId} not found`)
  return mapJobRow(row)
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

    let query = db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(items, eq(jobs.itemId, items.id))
      .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
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

  create: async (data: { job: JobCreateData; machineEntries: MachineEntryData[] }) => {
    const db = getDb()

    return db.transaction((tx) => {
      // Generate job number: JOB-YYYYMMDD-NNN
      const dateStr = data.job.date.replace(/-/g, '')
      const countResult = tx
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.date, data.job.date))
        .get()
      const count = (countResult?.count ?? 0) + 1
      const jobNumber = `JOB-${dateStr}-${String(count).padStart(3, '0')}`

      // Insert job
      const newJob = tx
        .insert(jobs)
        .values({
          ...data.job,
          jobNumber
        })
        .returning()
        .get()

      // Insert machine entries
      for (const entry of data.machineEntries) {
        tx.insert(jobMachineEntries)
          .values({
            ...entry,
            jobId: newJob.id
          })
          .run()
      }

      // Return with joins
      const row = tx
        .select()
        .from(jobs)
        .leftJoin(customers, eq(jobs.customerId, customers.id))
        .leftJoin(items, eq(jobs.itemId, items.id))
        .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
        .where(eq(jobs.id, newJob.id))
        .get()

      if (!row) throw new Error('Failed to retrieve created job')
      return mapJobRow(row)
    })
  },

  update: async (
    id: number,
    data: { job: Partial<JobCreateData>; machineEntries?: MachineEntryData[] }
  ) => {
    const db = getDb()

    return db.transaction((tx) => {
      // Update job fields
      if (Object.keys(data.job).length > 0) {
        tx.update(jobs)
          .set({ ...data.job, updatedAt: sql`(datetime('now'))` })
          .where(eq(jobs.id, id))
          .run()
      }

      // If machine entries provided, replace them
      if (data.machineEntries) {
        tx.delete(jobMachineEntries).where(eq(jobMachineEntries.jobId, id)).run()
        for (const entry of data.machineEntries) {
          tx.insert(jobMachineEntries)
            .values({
              ...entry,
              jobId: id
            })
            .run()
        }
      }

      // Return with joins
      const row = tx
        .select()
        .from(jobs)
        .leftJoin(customers, eq(jobs.customerId, customers.id))
        .leftJoin(items, eq(jobs.itemId, items.id))
        .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
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
      .leftJoin(items, eq(jobs.itemId, items.id))
      .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
      .where(and(eq(jobs.customerId, customerId), eq(jobs.itemId, itemId)))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .limit(1)
      .get()

    if (!row) return null

    const job = mapJobRow(row)

    const entries = db
      .select()
      .from(jobMachineEntries)
      .leftJoin(machineTypes, eq(jobMachineEntries.machineTypeId, machineTypes.id))
      .where(eq(jobMachineEntries.jobId, job.id))
      .all()
      .map((e) => ({
        ...e.job_machine_entries,
        machineTypeName: e.machine_types?.name ?? undefined
      }))

    return { job, machineEntries: entries }
  },

  getForReport: async (dateFrom: string, dateTo: string, customerId?: number) => {
    const db = getDb()
    const conditions = [gte(jobs.date, dateFrom), lte(jobs.date, dateTo)]

    if (customerId) {
      conditions.push(eq(jobs.customerId, customerId))
    }

    const rows = db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(items, eq(jobs.itemId, items.id))
      .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
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

    const rows = db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(items, eq(jobs.itemId, items.id))
      .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
      .where(and(...conditions))
      .orderBy(desc(jobs.date), desc(jobs.id))
      .all()

    return rows.map(mapJobRow)
  }
}
