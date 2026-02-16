import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function App() {
  useKeyboardShortcuts()

  return (
    <ErrorBoundary>
      <AppLayout />
      <Toaster position="top-right" />
    </ErrorBoundary>
  )
}

export default App
