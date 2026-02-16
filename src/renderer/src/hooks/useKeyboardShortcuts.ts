import { useEffect } from 'react'
import { useNavigation } from '@/stores/navigation'

export function useKeyboardShortcuts(): void {
  const navigate = useNavigation((s) => s.navigate)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      // Ctrl+N → New Job
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        navigate('job-form')
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
