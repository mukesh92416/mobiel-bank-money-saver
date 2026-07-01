import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { cn } from '@/utils/cn'

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [show, setShow] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => {
      setOffline(true)
      setShow(true)
    }
    const goOnline = () => {
      setOffline(false)
      setTimeout(() => setShow(false), 1500)
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-[70]',
            offline
              ? 'bg-amber-500 dark:bg-amber-600'
              : 'bg-emerald-500 dark:bg-emerald-600',
          )}
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2">
            <WifiOff className="size-3.5 text-white shrink-0" />
            <p className="text-xs font-medium text-white">
              {offline ? 'You are offline. Some features may be unavailable.' : 'Back online'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
