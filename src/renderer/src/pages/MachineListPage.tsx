import { useEffect } from 'react'
import { toast } from 'sonner'
import { useMachineStore } from '@/stores/machines'
import type { MachineFieldSchema } from '@/types/models'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

function fieldTypeBadge(type: MachineFieldSchema['type']) {
  switch (type) {
    case 'text':
      return <Badge variant="outline">Text</Badge>
    case 'number':
      return <Badge variant="secondary">Number</Badge>
    case 'select':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Select</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

export function MachineListPage() {
  const { machines, loading, fetchMachines, getMachineSchema } = useMachineStore()

  useEffect(() => {
    fetchMachines().catch(() => {
      toast.error('Failed to load machine types')
    })
  }, [fetchMachines])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Machines</h1>
        <p className="text-muted-foreground">
          Overview of machine types and their custom field configurations.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading machine types...</p>
        </div>
      ) : machines.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No machine types configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((machine) => {
            const fields = getMachineSchema(machine.id)
            return (
              <Card key={machine.id}>
                <CardHeader>
                  <CardTitle>{machine.name}</CardTitle>
                  {machine.description && (
                    <CardDescription>{machine.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No custom fields defined.</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Custom Fields</p>
                      <ul className="space-y-2">
                        {fields.map((field) => (
                          <li
                            key={field.name}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span>{field.label}</span>
                              {field.required && (
                                <span className="text-xs text-destructive">*</span>
                              )}
                            </div>
                            {fieldTypeBadge(field.type)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
