import { useMemo } from 'react'
import type { MachineType } from '@/types/models'

export interface JobFormCostData {
  quantity: number
  rate: number
  cooly: number
  machineTypeId: number | null
  machineCost: number
  machineWasteAmount: number
}

export interface CostBreakdown {
  baseAmount: number
  coolyAmount: number
  wasteAmount: number
  machineName: string | null
  machineCost: number
  machineWasteAmount: number
  grandTotal: number
}

export function useJobCostCalculator(
  formData: JobFormCostData,
  machineTypes: MachineType[]
): CostBreakdown {
  return useMemo(() => {
    const baseAmount = formData.quantity * formData.rate
    const coolyAmount = formData.cooly
    const wasteAmount = 0

    const machine = formData.machineTypeId
      ? machineTypes.find((m) => m.id === formData.machineTypeId)
      : null
    const machineName = machine?.name ?? null
    const machineCost = formData.machineCost
    const machineWasteAmount = formData.machineWasteAmount

    const grandTotal =
      baseAmount + coolyAmount + wasteAmount + machineCost + machineWasteAmount

    return {
      baseAmount,
      coolyAmount,
      wasteAmount,
      machineName,
      machineCost,
      machineWasteAmount,
      grandTotal
    }
  }, [
    formData.quantity,
    formData.rate,
    formData.cooly,
    formData.machineTypeId,
    formData.machineCost,
    formData.machineWasteAmount,
    machineTypes
  ])
}
