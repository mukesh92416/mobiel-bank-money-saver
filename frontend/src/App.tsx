import { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { useQuickSaveStore } from '@/store/quickSaveStore'
import { PaymentReturnHandler } from '@/components/quickSave/PaymentReturnHandler'
import { InstallPrompt } from '@/components/ui/InstallPrompt'
import { UpdateBanner } from '@/components/ui/UpdateBanner'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error && error.status === 401) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})

function App() {
  const isDark = useThemeStore((s) => s.isDark)
  const setDark = useThemeStore((s) => s.setDark)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const lastHiddenRef = useRef<number | null>(null)

  useEffect(() => {
    setDark(isDark)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        lastHiddenRef.current = Date.now()
      } else if (document.visibilityState === 'visible' && lastHiddenRef.current) {
        const elapsed = Date.now() - lastHiddenRef.current
        if (elapsed > 2000) {
          const state = useQuickSaveStore.getState()
          if (state.appLaunchTime !== null) {
            const session = state.sessions.find((s) => s.status === 'pending')
            if (session) {
              state.updateSession(session.id, { status: 'pending' })
            }
          }
        }
        lastHiddenRef.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <PaymentReturnHandler />
      <InstallPrompt />
      <UpdateBanner />
      <OfflineIndicator />
    </QueryClientProvider>
  )
}

export default App
