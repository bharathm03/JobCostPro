import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { machineTypes } from '../db/schema'

export const machinesHandler = {
  list: async () => {
    const db = getDb()
    return db.select().from(machineTypes).all()
  },

  getSchema: async (machineTypeId: number) => {
    const db = getDb()
    const machine = db
      .select()
      .from(machineTypes)
      .where(eq(machineTypes.id, machineTypeId))
      .get()
    if (!machine) {
      throw new Error(`Machine type ${machineTypeId} not found`)
    }
    return JSON.parse(machine.customFieldsSchema) as Array<{
      name: string
      label: string
      type: 'text' | 'number' | 'select'
      required: boolean
      options?: string[]
    }>
  }
}
