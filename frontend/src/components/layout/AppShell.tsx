import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { cn } from '@/utils/cn'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <main
        className={cn(
          'mx-auto max-w-lg min-h-screen',
          'pb-20 lg:pb-0',
          'transition-colors duration-200',
        )}
      >
        <AnimatePresence mode="wait">
          <div key={location.pathname}>{children}</div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}
