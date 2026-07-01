import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface FloatingActionButtonProps {
  icon: ReactNode
  onClick: () => void
  className?: string
}

export function FloatingActionButton({
  icon,
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.35)' }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex items-center justify-center size-14 rounded-full',
        'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
        'shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        className,
      )}
      aria-label="Floating action"
    >
      {icon}
    </motion.button>
  )
}
