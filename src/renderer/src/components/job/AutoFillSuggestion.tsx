import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AutoFillSuggestionProps {
  jobNumber: string
  onDismiss: () => void
}

export function AutoFillSuggestion({ jobNumber, onDismiss }: AutoFillSuggestionProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
        <Info className="size-4 shrink-0" />
        <span>
          Auto-filled from previous job <strong>{jobNumber}</strong>. All values are editable.
        </span>
      </div>
      <Button variant="ghost" size="icon-xs" onClick={onDismiss} className="shrink-0">
        <X className="size-4" />
      </Button>
    </div>
  )
}
