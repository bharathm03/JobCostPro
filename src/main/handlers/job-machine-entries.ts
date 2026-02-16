import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { jobMachineEntries, machineTypes } from '../db/schema'

export const jobMachineEntriesHandler = {
  listByJob: async (jobId: number) => {
    const db = getDb()
    const rows = db
      .select()
      .from(jobMachineEntries)
      .leftJoin(machineTypes, eq(jobMachineEntries.machineTypeId, machineTypes.id))
      .where(eq(jobMachineEntries.jobId, jobId))
      .all()

    return rows.map((row) => ({
      ...row.job_machine_entries,
      machineTypeName: row.machine_types?.name ?? undefined
    }))
  },

  create: async (data: {
    jobId: number
    machineTypeId: number
    machineCustomData: string
    cost: number
    wastePercentage: number
    wasteAmount: number
  }) => {
    const db = getDb()
    const result = db.insert(jobMachineEntries).values(data).returning().get()

    // Fetch with join to get machine type name
    const row = db
      .select()
      .from(jobMachineEntries)
      .leftJoin(machineTypes, eq(jobMachineEntries.machineTypeId, machineTypes.id))
      .where(eq(jobMachineEntries.id, result.id))
      .get()

    if (!row) throw new Error('Failed to retrieve created machine entry')
    return {
      ...row.job_machine_entries,
      machineTypeName: row.machine_types?.name ?? undefined
    }
  },

  delete: async (id: number) => {
    const db = getDb()
    db.delete(jobMachineEntries).where(eq(jobMachineEntries.id, id)).run()
  }
}
