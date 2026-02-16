import { eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const machineTypesData = [
  {
    name: 'Cutting Machine',
    description: 'For straight cuts, die cuts, creasing, and perforation',
    customFieldsSchema: JSON.stringify([
      {
        name: 'cuttingType',
        label: 'Cutting Type',
        type: 'select',
        required: true,
        options: ['Straight', 'Die Cut', 'Creasing', 'Perforation']
      },
      { name: 'cuttingCharge', label: 'Cutting Charge', type: 'number', required: true }
    ])
  },
  {
    name: 'PP Bag Making Machine',
    description: 'Polypropylene bag manufacturing',
    customFieldsSchema: JSON.stringify([
      { name: 'ppRollNo', label: 'PP Roll No.', type: 'text', required: true },
      { name: 'rollSize', label: 'Roll Size', type: 'text', required: true },
      { name: 'rollWeight', label: 'Roll Weight (kg)', type: 'number', required: true },
      { name: 'materialRate', label: 'Material Rate (per kg)', type: 'number', required: true },
      {
        name: 'bagType',
        label: 'Bag Type',
        type: 'select',
        required: true,
        options: ['Flat Bag', 'D-Cut', 'U-Cut', 'Loop Handle', 'Box Bag']
      },
      { name: 'bagsPerKg', label: 'Bags Per kg', type: 'number', required: true },
      {
        name: 'sealingType',
        label: 'Sealing Type',
        type: 'select',
        required: true,
        options: ['Side Seal', 'Bottom Seal', 'Center Seal']
      }
    ])
  },
  {
    name: 'HM Bag Making Machine',
    description: 'HDPE bag manufacturing',
    customFieldsSchema: JSON.stringify([
      { name: 'hmRollNo', label: 'HM Roll No.', type: 'text', required: true },
      { name: 'rollSize', label: 'Roll Size', type: 'text', required: true },
      { name: 'rollWeight', label: 'Roll Weight (kg)', type: 'number', required: true },
      { name: 'materialRate', label: 'Material Rate (per kg)', type: 'number', required: true },
      {
        name: 'bagType',
        label: 'Bag Type',
        type: 'select',
        required: true,
        options: ['Carry Bag', 'Liner Bag', 'Grocery Bag', 'Garbage Bag']
      },
      { name: 'bagsPerKg', label: 'Bags Per kg', type: 'number', required: true },
      {
        name: 'handleType',
        label: 'Handle Type',
        type: 'select',
        required: false,
        options: ['No Handle', 'Patch Handle', 'Loop Handle', 'Die Cut Handle']
      }
    ])
  },
  {
    name: 'Printing Machine',
    description: 'Multi-color printing on various materials',
    customFieldsSchema: JSON.stringify([
      { name: 'matter', label: 'Matter (Description)', type: 'text', required: true },
      { name: 'rollNo', label: 'Roll No.', type: 'text', required: true },
      { name: 'weight', label: 'Weight', type: 'number', required: false },
      { name: 'noOfColours', label: 'No. of Colours', type: 'number', required: true },
      { name: 'ptgCooly', label: 'Ptg Cooly (Printing Labor)', type: 'number', required: true },
      { name: 'mCost', label: 'M Cost (Machine Cost)', type: 'number', required: true }
    ])
  },
  {
    name: 'Binding Machine',
    description: 'Book and document binding',
    customFieldsSchema: JSON.stringify([
      {
        name: 'bindingType',
        label: 'Binding Type',
        type: 'select',
        required: true,
        options: ['Saddle Stitch', 'Perfect Binding', 'Spiral', 'Hardcover', 'Pad Binding']
      },
      { name: 'noOfPages', label: 'No. of Pages', type: 'number', required: true },
      {
        name: 'coverType',
        label: 'Cover Type',
        type: 'select',
        required: false,
        options: ['Soft Cover', 'Hard Cover', 'None']
      },
      { name: 'bindingCharge', label: 'Binding Charge', type: 'number', required: true }
    ])
  }
]

const categoriesData = [
  { name: 'PP Bags' },
  { name: 'HM Bags' },
  { name: 'Printed Material' },
  { name: 'Cut Sheets' },
  { name: 'Bound Books' }
]

const customersData = [
  { name: 'Harish', phone: '9876543210' },
  { name: 'Mathan', phone: '9876543211' },
  { name: 'Jaquar', phone: '9876543212' },
  { name: 'Excel', phone: '9876543213' }
]

const itemsData = [
  { name: 'PP Carry Bag 10x12', categoryId: 1, size: '10x12' },
  { name: 'HM Grocery Bag 16x20', categoryId: 2, size: '16x20' },
  { name: 'Letterhead A4', categoryId: 3, size: 'A4' },
  { name: 'Notebook A5', categoryId: 5, size: 'A5' }
]

export function seed(db: BetterSQLite3Database): void {
  const existing = db.select().from(schema.meta).where(eq(schema.meta.key, 'seeded')).get()
  if (existing) return

  // Seed machine types
  for (const mt of machineTypesData) {
    db.insert(schema.machineTypes).values(mt).run()
  }

  // Seed categories
  for (const cat of categoriesData) {
    db.insert(schema.itemCategories).values(cat).run()
  }

  // Seed customers
  for (const cust of customersData) {
    db.insert(schema.customers).values(cust).run()
  }

  // Seed items
  for (const item of itemsData) {
    db.insert(schema.items).values(item).run()
  }

  // Seed sample jobs
  const today = new Date().toISOString().split('T')[0]

  // Job 1: PP Bag job for Harish (Cutting → PP Machine)
  db.insert(schema.jobs)
    .values({
      jobNumber: `JOB-${today.replace(/-/g, '')}-001`,
      date: today,
      customerId: 1,
      itemId: 1,
      quantity: 1000,
      rate: 5,
      amount: 5000,
      wastePercentage: 3,
      wasteAmount: 150,
      cooly: 500,
      totalAmount: 6650,
      status: 'completed',
      notes: 'Sample PP bag order'
    })
    .run()

  db.insert(schema.jobMachineEntries)
    .values({
      jobId: 1,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({
        cuttingType: 'Straight',
        cuttingCharge: 500
      }),
      cost: 500,
      wastePercentage: 1,
      wasteAmount: 50
    })
    .run()

  db.insert(schema.jobMachineEntries)
    .values({
      jobId: 1,
      machineTypeId: 2,
      machineCustomData: JSON.stringify({
        ppRollNo: 'PP-101',
        rollSize: '10x12',
        rollWeight: 25,
        materialRate: 120,
        bagType: 'D-Cut',
        bagsPerKg: 40,
        sealingType: 'Bottom Seal'
      }),
      cost: 500,
      wastePercentage: 2,
      wasteAmount: 100
    })
    .run()

  // Job 2: HM Bag job for Jaquar (Cutting → HM Machine)
  db.insert(schema.jobs)
    .values({
      jobNumber: `JOB-${today.replace(/-/g, '')}-002`,
      date: today,
      customerId: 3,
      itemId: 2,
      quantity: 500,
      rate: 8,
      amount: 4000,
      wastePercentage: 2,
      wasteAmount: 80,
      cooly: 400,
      totalAmount: 5180,
      status: 'in-progress',
      notes: 'Sample HM bag order'
    })
    .run()

  db.insert(schema.jobMachineEntries)
    .values({
      jobId: 2,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({
        cuttingType: 'Die Cut',
        cuttingCharge: 300
      }),
      cost: 300,
      wastePercentage: 1,
      wasteAmount: 40
    })
    .run()

  db.insert(schema.jobMachineEntries)
    .values({
      jobId: 2,
      machineTypeId: 3,
      machineCustomData: JSON.stringify({
        hmRollNo: 'HM-201',
        rollSize: '16x20',
        rollWeight: 30,
        materialRate: 100,
        bagType: 'Carry Bag',
        bagsPerKg: 25,
        handleType: 'Patch Handle'
      }),
      cost: 400,
      wastePercentage: 1.5,
      wasteAmount: 60
    })
    .run()

  // Job 3: Printing job for Mathan (Printing → Cutting)
  db.insert(schema.jobs)
    .values({
      jobNumber: `JOB-${today.replace(/-/g, '')}-003`,
      date: today,
      customerId: 2,
      itemId: 3,
      quantity: 2000,
      rate: 3,
      amount: 6000,
      wastePercentage: 1,
      wasteAmount: 60,
      cooly: 600,
      totalAmount: 7860,
      status: 'draft',
      notes: 'Sample printing job'
    })
    .run()

  db.insert(schema.jobMachineEntries)
    .values({
      jobId: 3,
      machineTypeId: 4,
      machineCustomData: JSON.stringify({
        matter: 'Company Letterhead',
        rollNo: 'R-301',
        weight: 50,
        noOfColours: 4,
        ptgCooly: 800,
        mCost: 400
      }),
      cost: 1200,
      wastePercentage: 0.5,
      wasteAmount: 30
    })
    .run()

  // Mark as seeded
  db.insert(schema.meta).values({ key: 'seeded', value: 'true' }).run()
}
