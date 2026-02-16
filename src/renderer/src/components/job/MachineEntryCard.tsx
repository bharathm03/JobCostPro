import { X } from 'lucide-react'
import type { MachineType, MachineFieldSchema } from '@/types/models'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DynamicField } from './DynamicField'

export interface MachineEntryData {
  machineTypeId: number
  machineCustomData: Record<string, unknown>
  cost: number
  wastePercentage: number
  wasteAmount: number
}

interface MachineEntryCardProps {
  machineType: MachineType
  entry: MachineEntryData
  onChange: (updated: MachineEntryData) => void
  onRemove: () => void
}

function parseSchema(machineType: MachineType): MachineFieldSchema[] {
  try {
    return JSON.parse(machineType.customFieldsSchema) as MachineFieldSchema[]
  } catch {
    return []
  }
}

export function MachineEntryCard({
  machineType,
  entry,
  onChange,
  onRemove
}: MachineEntryCardProps) {
  const schema = parseSchema(machineType)

  const handleCustomDataChange = (name: string, value: unknown) => {
    onChange({
      ...entry,
      machineCustomData: { ...entry.machineCustomData, [name]: value }
    })
  }

  const handleCostChange = (cost: number) => {
    onChange({ ...entry, cost })
  }

  const handleWastePercentageChange = (wastePercentage: number) => {
    const wasteAmount = entry.cost * (wastePercentage / 100)
    onChange({ ...entry, wastePercentage, wasteAmount: Math.round(wasteAmount * 100) / 100 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{machineType.name}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-xs" onClick={onRemove}>
            <X className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {schema.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schema.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={entry.machineCustomData[field.name]}
                onChange={handleCustomDataChange}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`machine-cost-${machineType.id}`}>Cost</Label>
            <Input
              id={`machine-cost-${machineType.id}`}
              type="number"
              min={0}
              value={entry.cost || ''}
              onChange={(e) => handleCostChange(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`machine-waste-pct-${machineType.id}`}>Waste %</Label>
            <Input
              id={`machine-waste-pct-${machineType.id}`}
              type="number"
              min={0}
              max={100}
              value={entry.wastePercentage || ''}
              onChange={(e) => handleWastePercentageChange(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Waste Amount</Label>
            <Input
              type="number"
              value={entry.wasteAmount.toFixed(2)}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
