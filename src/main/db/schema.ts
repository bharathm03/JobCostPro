import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

export const itemCategories = sqliteTable('item_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
})

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => itemCategories.id),
  size: text('size').notNull()
})

export const machineTypes = sqliteTable('machine_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  customFieldsSchema: text('custom_fields_schema').notNull() // JSON
})

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobNumber: text('job_number').notNull().unique(),
  date: text('date').notNull(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id),
  quantity: integer('quantity').notNull(),
  rate: real('rate').notNull(),
  amount: real('amount').notNull(),
  wastePercentage: real('waste_percentage').notNull().default(0),
  wasteAmount: real('waste_amount').notNull().default(0),
  cooly: real('cooly').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  notes: text('notes'),
  status: text('status').notNull().default('draft'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

export const jobMachineEntries = sqliteTable('job_machine_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id')
    .notNull()
    .references(() => jobs.id, { onDelete: 'cascade' }),
  machineTypeId: integer('machine_type_id')
    .notNull()
    .references(() => machineTypes.id),
  machineCustomData: text('machine_custom_data').notNull().default('{}'), // JSON
  cost: real('cost').notNull().default(0),
  wastePercentage: real('waste_percentage').notNull().default(0),
  wasteAmount: real('waste_amount').notNull().default(0)
})

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value')
})
