import { useEffect, useState, useCallback } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigation } from '@/stores/navigation'
import { useMachineStore } from '@/stores/machines'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export function MachineSelectionModal() {
  const { navigate } = useNavigation()
  const { machines, fetchMachines } = useMachineStore()
  const [open, setOpen] = useState(false)
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null)

  // Listen for the app:new-job custom event to open the modal
  useEffect(() => {
    const handler = () => {
      setSelectedMachineId(null)
      fetchMachines()
      setOpen(true)
    }
    window.addEventListener('app:new-job', handler)
    return () => window.removeEventListener('app:new-job', handler)
  }, [fetchMachines])

  const handleConfirm = useCallback(() => {
    if (!selectedMachineId) {
      toast.error('Please select a machine')
      return
    }
    setOpen(false)
    navigate('job-form', { machineTypeId: selectedMachineId })
  }, [selectedMachineId, navigate])

  // Keyboard shortcuts: 1-9 to select, Enter to confirm
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= machines.length) {
        setSelectedMachineId(machines[num - 1].id)
      } else if (e.key === 'Enter' && selectedMachineId) {
        e.preventDefault()
        handleConfirm()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, machines, selectedMachineId, handleConfirm])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Machine</DialogTitle>
          <DialogDescription>
            Choose the machine for this job before proceeding.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {machines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No machines available. Please add machines first.
            </p>
          ) : (
            machines.map((machine, index) => (
              <button
                key={machine.id}
                type="button"
                onClick={() => setSelectedMachineId(machine.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                  selectedMachineId === machine.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border'
                )}
              >
                <kbd
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded border text-xs font-mono font-semibold',
                    selectedMachineId === machine.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </kbd>
                <div className="flex-1">
                  <div className="font-medium text-sm">{machine.name}</div>
                  {machine.model && (
                    <div className="text-xs text-muted-foreground">{machine.model}</div>
                  )}
                </div>
                {selectedMachineId === machine.id && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedMachineId}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
