import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { employees, machineTypes } from '../db/schema'

export const employeesHandler = {
  list: async () => {
    const db = getDb()
    return db
      .select()
      .from(employees)
      .leftJoin(machineTypes, eq(employees.machineTypeId, machineTypes.id))
      .orderBy(employees.name)
      .all()
      .map((row) => ({
        ...row.employees,
        machineTypeName: row.machine_types?.name ?? undefined
      }))
  },

  create: async (data: { name: string; phone: string | null; machineTypeId: number | null }) => {
    const db = getDb()
    return db.insert(employees).values(data).returning().get()
  },

  update: async (
    id: number,
    data: Partial<{ name: string; phone: string | null; machineTypeId: number | null }>
  ) => {
    const db = getDb()
    return db.update(employees).set(data).where(eq(employees.id, id)).returning().get()
  },

  delete: async (id: number) => {
    const db = getDb()
    db.delete(employees).where(eq(employees.id, id)).run()
  }
}
