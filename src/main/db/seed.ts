import { eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const cuttingFields = JSON.stringify([
  { name: 'matterName', label: 'Matter Name', type: 'text', required: true },
  { name: 'size', label: 'Size', type: 'text', required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'rate', label: 'Rate', type: 'number', required: true },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'waste', label: 'Waste', type: 'number', required: false },
  { name: 'wasteRate', label: 'Waste Rate', type: 'number', required: false },
  { name: 'wasteAmount', label: 'Waste Amount', type: 'number', required: false }
])

const machineTypesData = [
  {
    name: 'Printing',
    model: 'Printing Machine',
    description: 'Multi-color printing on various materials',
    customFieldsSchema: JSON.stringify([
      { name: 'matter', label: 'Matter Name', type: 'text', required: true },
      { name: 'rollNo', label: 'Roll No.', type: 'text', required: true },
      { name: 'size', label: 'Size', type: 'text', required: true },
      { name: 'weight', label: 'Weight', type: 'number', required: false },
      { name: 'noOfColours', label: 'No. of Colours', type: 'number', required: true },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'marginAmount', label: 'Margin Amount', type: 'number', required: false },
      { name: 'totalAmount', label: 'Amount', type: 'number', required: true }
    ])
  },
  {
    name: 'Harish',
    model: 'Cutting Machine',
    description: 'Cutting machine - Harish',
    customFieldsSchema: cuttingFields
  },
  {
    name: 'Mathan',
    model: 'Cutting Machine',
    description: 'Cutting machine - Mathan',
    customFieldsSchema: cuttingFields
  },
  {
    name: 'Jaquar',
    model: 'Cutting Machine',
    description: 'Cutting machine - Jaquar',
    customFieldsSchema: cuttingFields
  },
  {
    name: 'Excel',
    model: 'Cutting Machine',
    description: 'Cutting machine - Excel',
    customFieldsSchema: cuttingFields
  },
  {
    name: 'PP',
    model: 'PP Bag Making Machine',
    description: 'Polypropylene bag manufacturing',
    customFieldsSchema: JSON.stringify([
      { name: 'ppRollNo', label: 'Roll No.', type: 'text', required: true },
      { name: 'rollSize', label: 'Size', type: 'text', required: true },
      { name: 'cooly', label: 'Cooly', type: 'number', required: false },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'waste', label: 'Waste', type: 'number', required: false },
      { name: 'totalAmount', label: 'Amount', type: 'number', required: true }
    ])
  },
  {
    name: 'HM',
    model: 'HM Bag Making Machine',
    description: 'HDPE bag manufacturing',
    customFieldsSchema: JSON.stringify([
      { name: 'hmRollNo', label: 'Roll No.', type: 'text', required: true },
      { name: 'rollSize', label: 'Size', type: 'text', required: true },
      { name: 'cooly', label: 'Cooly', type: 'number', required: false },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'waste', label: 'Waste', type: 'number', required: false },
      { name: 'totalAmount', label: 'Amount', type: 'number', required: true }
    ])
  }
]

const categoriesData = [
  { name: 'PP Bags' },
  { name: 'HM Bags' },
  { name: 'Printed Material' },
  { name: 'Cut Sheets' }
]

const customersData = [
  { name: 'Lakshmi Traders', phone: '9876543210', address: '12 Anna Nagar, Chennai' },
  { name: 'Sri Balaji Enterprises', phone: '9876543211', address: '45 T Nagar, Chennai' },
  { name: 'Murugan Stores', phone: '9876543212', address: '78 Mylapore, Chennai' },
  { name: 'KVR Packaging', phone: '9876543213', address: '23 Ambattur, Chennai' },
  { name: 'New India Plastics', phone: '9876543214', address: '56 Guindy, Chennai' },
  { name: 'Anand Paper House', phone: '9876543215', address: '89 Perambur, Chennai' }
]

const employeesData = [
  { name: 'Ravi', phone: '9000000001', machineTypeId: 1 },
  { name: 'Suresh', phone: '9000000002', machineTypeId: 2 },
  { name: 'Kumar', phone: '9000000003', machineTypeId: 6 },
  { name: 'Prakash', phone: '9000000004', machineTypeId: 7 },
  { name: 'Manoj', phone: '9000000005', machineTypeId: 3 },
  { name: 'Dinesh', phone: '9000000006', machineTypeId: 4 },
  { name: 'Vijay', phone: '9000000007', machineTypeId: 5 },
  { name: 'Sathish', phone: '9000000008', machineTypeId: 1 }
]

const itemsData = [
  { name: 'PP Carry Bag 10x12', categoryId: 1, size: '10x12' },
  { name: 'HM Grocery Bag 16x20', categoryId: 2, size: '16x20' },
  { name: 'Letterhead A4', categoryId: 3, size: 'A4' },
  { name: 'Cut Sheet A3', categoryId: 4, size: 'A3' },
  { name: 'PP Carry Bag 14x18', categoryId: 1, size: '14x18' },
  { name: 'HM D-Cut Bag 12x16', categoryId: 2, size: '12x16' },
  { name: 'Bill Book A5', categoryId: 3, size: 'A5' },
  { name: 'Visiting Card', categoryId: 3, size: '3.5x2' },
  { name: 'PP Shopping Bag 16x22', categoryId: 1, size: '16x22' },
  { name: 'Cut Sheet B4', categoryId: 4, size: 'B4' }
]

/** Returns YYYY-MM-DD string for `daysAgo` days before today */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

interface JobSeed {
  date: string
  customerId: number
  employeeId: number
  itemId: number
  quantity: number
  rate: number
  cooly: number
  machineTypeId: number
  machineCustomData: string
  machineCost: number
  status: string
  notes: string
}

function buildJob(s: JobSeed) {
  const amount = s.quantity * s.rate
  const wasteAmount = 0
  const machineWasteAmount = 0
  const totalAmount = amount + s.cooly + wasteAmount + s.machineCost
  return {
    ...s,
    amount,
    wasteAmount,
    machineWasteAmount,
    totalAmount,
    jobNumber: '', // filled in loop
    notes: s.notes || null
  }
}

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

  // Seed employees
  for (const emp of employeesData) {
    db.insert(schema.employees).values(emp).run()
  }

  // Seed jobs — spread across the last 3 weeks
  const jobSeeds: JobSeed[] = [
    // === Today ===
    {
      date: daysAgo(0), customerId: 1, employeeId: 2, itemId: 4,
      quantity: 1000, rate: 5, cooly: 500,
      machineTypeId: 2,
      machineCustomData: JSON.stringify({ matterName: 'Card sheets', size: '23x36', quantity: 1000, rate: 5, amount: 5000, waste: 30, wasteRate: 2, wasteAmount: 60 }),
      machineCost: 500, status: 'completed', notes: 'Cutting job - card sheets'
    },
    {
      date: daysAgo(0), customerId: 2, employeeId: 3, itemId: 2,
      quantity: 500, rate: 8, cooly: 400,
      machineTypeId: 7,
      machineCustomData: JSON.stringify({ hmRollNo: 'HM-201', rollSize: '16x20', cooly: 400, amount: 4000, waste: 2, totalAmount: 4400 }),
      machineCost: 400, status: 'in-progress', notes: 'HM grocery bags'
    },
    {
      date: daysAgo(0), customerId: 1, employeeId: 1, itemId: 3,
      quantity: 2000, rate: 3, cooly: 600,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({ matter: 'Company Letterhead', rollNo: 'R-301', size: 'A4', weight: 50, noOfColours: 4, amount: 6000, marginAmount: 200, totalAmount: 6200 }),
      machineCost: 1200, status: 'completed', notes: 'Letterhead printing'
    },
    // === Yesterday ===
    {
      date: daysAgo(1), customerId: 3, employeeId: 5, itemId: 10,
      quantity: 800, rate: 4, cooly: 350,
      machineTypeId: 3,
      machineCustomData: JSON.stringify({ matterName: 'Invoice sheets', size: 'B4', quantity: 800, rate: 4, amount: 3200, waste: 20, wasteRate: 2, wasteAmount: 40 }),
      machineCost: 350, status: 'completed', notes: 'B4 invoice cut'
    },
    {
      date: daysAgo(1), customerId: 4, employeeId: 3, itemId: 1,
      quantity: 3000, rate: 2, cooly: 450,
      machineTypeId: 6,
      machineCustomData: JSON.stringify({ ppRollNo: 'PP-105', rollSize: '10x12', cooly: 450, amount: 6000, waste: 1.5, totalAmount: 6450 }),
      machineCost: 300, status: 'completed', notes: 'PP carry bags small'
    },
    {
      date: daysAgo(1), customerId: 5, employeeId: 8, itemId: 8,
      quantity: 5000, rate: 1.5, cooly: 700,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({ matter: 'Visiting Cards', rollNo: 'R-302', size: '3.5x2', weight: 15, noOfColours: 2, amount: 7500, marginAmount: 150, totalAmount: 7650 }),
      machineCost: 700, status: 'completed', notes: 'Visiting card print run'
    },
    // === 2 days ago ===
    {
      date: daysAgo(2), customerId: 6, employeeId: 6, itemId: 4,
      quantity: 1500, rate: 4.5, cooly: 550,
      machineTypeId: 4,
      machineCustomData: JSON.stringify({ matterName: 'Flyer sheets', size: 'A3', quantity: 1500, rate: 4.5, amount: 6750, waste: 30, wasteRate: 2, wasteAmount: 60 }),
      machineCost: 450, status: 'completed', notes: 'A3 flyers cut on Jaquar'
    },
    {
      date: daysAgo(2), customerId: 2, employeeId: 4, itemId: 6,
      quantity: 2000, rate: 3.5, cooly: 500,
      machineTypeId: 7,
      machineCustomData: JSON.stringify({ hmRollNo: 'HM-202', rollSize: '12x16', cooly: 350, amount: 7000, waste: 1, totalAmount: 7350 }),
      machineCost: 350, status: 'completed', notes: 'HM D-cut bags'
    },
    // === 3 days ago ===
    {
      date: daysAgo(3), customerId: 1, employeeId: 1, itemId: 7,
      quantity: 1000, rate: 6, cooly: 800,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({ matter: 'Bill Book Cover', rollNo: 'R-303', size: 'A5', weight: 35, noOfColours: 3, amount: 6000, marginAmount: 300, totalAmount: 6300 }),
      machineCost: 900, status: 'completed', notes: 'Bill book printing'
    },
    {
      date: daysAgo(3), customerId: 3, employeeId: 7, itemId: 4,
      quantity: 2000, rate: 5, cooly: 600,
      machineTypeId: 5,
      machineCustomData: JSON.stringify({ matterName: 'Label sheets', size: 'A3', quantity: 2000, rate: 5, amount: 10000, waste: 60, wasteRate: 3, wasteAmount: 180 }),
      machineCost: 550, status: 'completed', notes: 'Label sheets cut on Excel'
    },
    // === 5 days ago ===
    {
      date: daysAgo(5), customerId: 4, employeeId: 2, itemId: 10,
      quantity: 600, rate: 4, cooly: 300,
      machineTypeId: 2,
      machineCustomData: JSON.stringify({ matterName: 'Pamphlet sheets', size: 'B4', quantity: 600, rate: 4, amount: 2400, waste: 12, wasteRate: 2, wasteAmount: 24 }),
      machineCost: 250, status: 'completed', notes: 'Pamphlet cutting'
    },
    {
      date: daysAgo(5), customerId: 5, employeeId: 3, itemId: 5,
      quantity: 4000, rate: 2.5, cooly: 500,
      machineTypeId: 6,
      machineCustomData: JSON.stringify({ ppRollNo: 'PP-106', rollSize: '14x18', cooly: 500, amount: 10000, waste: 1.5, totalAmount: 10500 }),
      machineCost: 400, status: 'completed', notes: 'PP carry bags medium'
    },
    // === 7 days ago (last week) ===
    {
      date: daysAgo(7), customerId: 6, employeeId: 8, itemId: 3,
      quantity: 3000, rate: 3, cooly: 750,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({ matter: 'Invoice Pads', rollNo: 'R-304', size: 'A4', weight: 60, noOfColours: 2, amount: 9000, marginAmount: 250, totalAmount: 9250 }),
      machineCost: 800, status: 'completed', notes: 'Invoice pad printing'
    },
    {
      date: daysAgo(7), customerId: 1, employeeId: 5, itemId: 4,
      quantity: 1200, rate: 5, cooly: 400,
      machineTypeId: 3,
      machineCustomData: JSON.stringify({ matterName: 'Poster sheets', size: 'A3', quantity: 1200, rate: 5, amount: 6000, waste: 30, wasteRate: 2, wasteAmount: 60 }),
      machineCost: 400, status: 'completed', notes: 'Poster cutting on Mathan'
    },
    // === 8 days ago ===
    {
      date: daysAgo(8), customerId: 2, employeeId: 4, itemId: 2,
      quantity: 1000, rate: 8, cooly: 600,
      machineTypeId: 7,
      machineCustomData: JSON.stringify({ hmRollNo: 'HM-203', rollSize: '16x20', cooly: 600, amount: 8000, waste: 2, totalAmount: 8600 }),
      machineCost: 500, status: 'completed', notes: 'HM grocery bags bulk'
    },
    {
      date: daysAgo(8), customerId: 3, employeeId: 6, itemId: 10,
      quantity: 900, rate: 4, cooly: 350,
      machineTypeId: 4,
      machineCustomData: JSON.stringify({ matterName: 'Brochure sheets', size: 'B4', quantity: 900, rate: 4, amount: 3600, waste: 18, wasteRate: 2, wasteAmount: 36 }),
      machineCost: 350, status: 'completed', notes: 'Brochure cut on Jaquar'
    },
    // === 10 days ago ===
    {
      date: daysAgo(10), customerId: 4, employeeId: 1, itemId: 7,
      quantity: 1500, rate: 6, cooly: 900,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({ matter: 'Receipt Books', rollNo: 'R-305', size: 'A5', weight: 40, noOfColours: 1, amount: 9000, marginAmount: 200, totalAmount: 9200 }),
      machineCost: 600, status: 'completed', notes: 'Receipt book printing'
    },
    {
      date: daysAgo(10), customerId: 5, employeeId: 7, itemId: 4,
      quantity: 2500, rate: 5, cooly: 700,
      machineTypeId: 5,
      machineCustomData: JSON.stringify({ matterName: 'Wrapper sheets', size: 'A3', quantity: 2500, rate: 5, amount: 12500, waste: 75, wasteRate: 3, wasteAmount: 225 }),
      machineCost: 600, status: 'completed', notes: 'Wrapper sheets on Excel'
    },
    // === 12 days ago ===
    {
      date: daysAgo(12), customerId: 6, employeeId: 2, itemId: 4,
      quantity: 800, rate: 5, cooly: 400,
      machineTypeId: 2,
      machineCustomData: JSON.stringify({ matterName: 'Menu cards', size: '23x36', quantity: 800, rate: 5, amount: 4000, waste: 16, wasteRate: 2, wasteAmount: 32 }),
      machineCost: 350, status: 'completed', notes: 'Menu card cutting'
    },
    {
      date: daysAgo(12), customerId: 1, employeeId: 3, itemId: 9,
      quantity: 5000, rate: 2, cooly: 500,
      machineTypeId: 6,
      machineCustomData: JSON.stringify({ ppRollNo: 'PP-107', rollSize: '16x22', cooly: 500, amount: 10000, waste: 1, totalAmount: 10500 }),
      machineCost: 450, status: 'completed', notes: 'PP shopping bags large'
    },
    // === 14 days ago (2 weeks) ===
    {
      date: daysAgo(14), customerId: 2, employeeId: 8, itemId: 8,
      quantity: 10000, rate: 1.5, cooly: 1000,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({ matter: 'Business Cards', rollNo: 'R-306', size: '3.5x2', weight: 25, noOfColours: 4, amount: 15000, marginAmount: 500, totalAmount: 15500 }),
      machineCost: 1300, status: 'completed', notes: 'Bulk business cards'
    },
    {
      date: daysAgo(14), customerId: 3, employeeId: 5, itemId: 10,
      quantity: 1100, rate: 4, cooly: 400,
      machineTypeId: 3,
      machineCustomData: JSON.stringify({ matterName: 'Catalog sheets', size: 'B4', quantity: 1100, rate: 4, amount: 4400, waste: 22, wasteRate: 2, wasteAmount: 44 }),
      machineCost: 380, status: 'completed', notes: 'Catalog sheets on Mathan'
    },
    // === 16 days ago ===
    {
      date: daysAgo(16), customerId: 4, employeeId: 4, itemId: 6,
      quantity: 3000, rate: 3.5, cooly: 600,
      machineTypeId: 7,
      machineCustomData: JSON.stringify({ hmRollNo: 'HM-204', rollSize: '12x16', cooly: 400, amount: 10500, waste: 1, totalAmount: 10900 }),
      machineCost: 400, status: 'completed', notes: 'HM D-cut bags order'
    },
    {
      date: daysAgo(16), customerId: 5, employeeId: 6, itemId: 4,
      quantity: 1800, rate: 4.5, cooly: 500,
      machineTypeId: 4,
      machineCustomData: JSON.stringify({ matterName: 'Envelope sheets', size: 'A3', quantity: 1800, rate: 4.5, amount: 8100, waste: 36, wasteRate: 2, wasteAmount: 72 }),
      machineCost: 450, status: 'completed', notes: 'Envelope cutting on Jaquar'
    },
    // === 18 days ago ===
    {
      date: daysAgo(18), customerId: 6, employeeId: 1, itemId: 3,
      quantity: 4000, rate: 3, cooly: 900,
      machineTypeId: 1,
      machineCustomData: JSON.stringify({ matter: 'Stationery Headers', rollNo: 'R-307', size: 'A4', weight: 70, noOfColours: 3, amount: 12000, marginAmount: 350, totalAmount: 12350 }),
      machineCost: 1050, status: 'completed', notes: 'Stationery header printing'
    },
    {
      date: daysAgo(18), customerId: 1, employeeId: 7, itemId: 4,
      quantity: 3000, rate: 5, cooly: 800,
      machineTypeId: 5,
      machineCustomData: JSON.stringify({ matterName: 'Box wraps', size: 'A3', quantity: 3000, rate: 5, amount: 15000, waste: 90, wasteRate: 3, wasteAmount: 270 }),
      machineCost: 700, status: 'completed', notes: 'Box wrap cutting on Excel'
    },
    // === 20 days ago ===
    {
      date: daysAgo(20), customerId: 2, employeeId: 2, itemId: 4,
      quantity: 500, rate: 5, cooly: 250,
      machineTypeId: 2,
      machineCustomData: JSON.stringify({ matterName: 'Tag sheets', size: '23x36', quantity: 500, rate: 5, amount: 2500, waste: 10, wasteRate: 2, wasteAmount: 20 }),
      machineCost: 200, status: 'completed', notes: 'Tag cutting'
    },
    {
      date: daysAgo(20), customerId: 3, employeeId: 3, itemId: 5,
      quantity: 6000, rate: 2.5, cooly: 700,
      machineTypeId: 6,
      machineCustomData: JSON.stringify({ ppRollNo: 'PP-108', rollSize: '14x18', cooly: 700, amount: 15000, waste: 1.5, totalAmount: 15700 }),
      machineCost: 500, status: 'completed', notes: 'PP bags bulk order'
    }
  ]

  // Track job counts per date for job number generation
  const dateCounters: Record<string, number> = {}

  for (const s of jobSeeds) {
    const j = buildJob(s)
    dateCounters[j.date] = (dateCounters[j.date] ?? 0) + 1
    const dateStr = j.date.replace(/-/g, '')
    j.jobNumber = `JOB-${dateStr}-${String(dateCounters[j.date]).padStart(3, '0')}`

    db.insert(schema.jobs).values(j).run()
  }

  // Mark as seeded
  db.insert(schema.meta).values({ key: 'seeded', value: 'true' }).run()
}
