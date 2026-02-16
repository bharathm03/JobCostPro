import { useMemo } from 'react'
import type { MachineType } from '@/types/models'

interface MachineEntryData {
  machineTypeId: number
  machineCustomData: Record<string, unknown>
  cost: number
  wastePercentage: number
  wasteAmount: number
}

export interface JobFormCostData {
  quantity: number
  rate: number
  wastePercentage: number
  cooly: number
  machineEntries: MachineEntryData[]
}

export interface MachineCostLine {
  machineTypeId: number
  machineName: string
  cost: number
  wasteAmount: number
}

export interface CostBreakdown {
  baseAmount: number
  coolyAmount: number
  wasteAmount: number
  machineCosts: MachineCostLine[]
  totalMachineCost: number
  totalMachineWaste: number
  grandTotal: number
}

export function useJobCostCalculator(
  formData: JobFormCostData,
  machineTypes: MachineType[]
): CostBreakdown {
  return useMemo(() => {
    const baseAmount = formData.quantity * formData.rate
    const coolyAmount = formData.cooly
    const wasteAmount = baseAmount * (formData.wastePercentage / 100)

    const machineCosts: MachineCostLine[] = formData.machineEntries.map((entry) => {
      const machine = machineTypes.find((m) => m.id === entry.machineTypeId)
      return {
        machineTypeId: entry.machineTypeId,
        machineName: machine?.name ?? `Machine #${entry.machineTypeId}`,
        cost: entry.cost,
        wasteAmount: entry.wasteAmount
      }
    })

    const totalMachineCost = machineCosts.reduce((sum, m) => sum + m.cost, 0)
    const totalMachineWaste = machineCosts.reduce((sum, m) => sum + m.wasteAmount, 0)

    const grandTotal =
      baseAmount + coolyAmount + wasteAmount + totalMachineCost + totalMachineWaste

    return {
      baseAmount,
      coolyAmount,
      wasteAmount,
      machineCosts,
      totalMachineCost,
      totalMachineWaste,
      grandTotal
    }
  }, [
    formData.quantity,
    formData.rate,
    formData.wastePercentage,
    formData.cooly,
    formData.machineEntries,
    machineTypes
  ])
}
