import type { MachineFieldSchema } from '@/types/models'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface DynamicFieldProps {
  field: MachineFieldSchema
  value: unknown
  onChange: (name: string, value: unknown) => void
  onAdvance?: () => void
}

export function DynamicField({ field, value, onChange, onAdvance }: DynamicFieldProps) {
  const id = `dynamic-field-${field.name}`

  if (field.type === 'select') {
    return (
      <div className="space-y-1">
        <Label htmlFor={id}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select
          value={String(value ?? '')}
          onValueChange={(val) => {
            onChange(field.name, val)
            if (onAdvance) setTimeout(onAdvance, 0)
          }}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={field.type === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(e) =>
          onChange(
            field.name,
            field.type === 'number' ? Number(e.target.value) || 0 : e.target.value
          )
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onAdvance?.()
          }
        }}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    </div>
  )
}
