import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional()
})

export const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  categoryId: z.number({ required_error: 'Category is required' }).int().positive(),
  size: z.string().min(1, 'Size is required')
})

export const jobSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  customerId: z.number({ required_error: 'Customer is required' }).int().positive(),
  itemId: z.number({ required_error: 'Item is required' }).int().positive(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  rate: z.number().positive('Rate must be positive'),
  wastePercentage: z.number().min(0).max(100, 'Waste percentage must be between 0 and 100'),
  cooly: z.number().min(0, 'Cooly must be 0 or greater'),
  notes: z.string().nullable().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled'])
})

export const machineEntrySchema = z.object({
  machineTypeId: z.number({ required_error: 'Machine type is required' }).int().positive(),
  machineCustomData: z.string().min(1, 'Machine data is required'),
  cost: z.number().min(0, 'Cost must be 0 or greater'),
  wastePercentage: z.number().min(0).max(100, 'Waste percentage must be between 0 and 100'),
  wasteAmount: z.number().min(0, 'Waste amount must be 0 or greater')
})

export type CustomerFormData = z.infer<typeof customerSchema>
export type ItemFormData = z.infer<typeof itemSchema>
export type JobFormData = z.infer<typeof jobSchema>
export type MachineEntryFormData = z.infer<typeof machineEntrySchema>
