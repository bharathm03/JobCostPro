import { useEffect } from 'react'
import { useNavigation, type Page } from '@/stores/navigation'

const altKeyPages: Page[] = [
  'dashboard',
  'jobs',
  'customers',
  'employees',
  'items',
  'machines',
  'reports'
]

export function useKeyboardShortcuts(): void {
  const navigate = useNavigation((s) => s.navigate)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      // Ctrl+N → New Job (opens machine selection modal)
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('app:new-job'))
      }

      // Ctrl+S → Save (dispatches custom event for forms to listen to)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('app:save'))
      }

      // Escape → Navigate back or close
      if (e.key === 'Escape') {
        const currentPage = useNavigation.getState().currentPage
        if (currentPage === 'job-form') {
          navigate('jobs')
        }
      }

      // Alt+1 through Alt+7 → Navigate sidebar pages
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key, 10)
        if (num >= 1 && num <= 7) {
          // Skip when focus is in form elements
          const tag = (e.target as HTMLElement)?.tagName
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

          e.preventDefault()
          navigate(altKeyPages[num - 1])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
