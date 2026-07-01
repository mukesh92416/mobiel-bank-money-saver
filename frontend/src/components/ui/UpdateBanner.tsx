import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export function UpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  const handleUpdate = useCallback(() => {
    if (!waitingWorker) return
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    setShowBanner(false)
  }, [waitingWorker])

  const handleDismiss = useCallback(() => {
    setShowBanner(false)
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker)
                setShowBanner(true)
              }
            })
          }
        })
      })
    }
  }, [])

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-[70]',
            'bg-emerald-600 dark:bg-emerald-700 shadow-lg',
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="size-4 text-white shrink-0" />
              <p className="text-sm font-medium text-white">
                New version available.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="text-xs font-semibold text-white/80 hover:text-white px-2 py-1 transition-colors"
              >
                Later
              </button>
              <Button variant="primary" size="sm" onClick={handleUpdate}>
                Update now
              </Button>
              <button
                onClick={handleDismiss}
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
