import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const colorVariants = {
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  blue: 'bg-gradient-to-r from-blue-500 to-blue-400',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
  red: 'bg-gradient-to-r from-red-500 to-red-400',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
  pink: 'bg-gradient-to-r from-pink-500 to-pink-400',
}

const sizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

type ProgressColor = keyof typeof colorVariants
type ProgressSize = keyof typeof sizes

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  color?: ProgressColor
  size?: ProgressSize
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'emerald',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
          sizes[size],
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
          className={cn('h-full rounded-full', colorVariants[color])}
        />
      </div>
    </div>
  )
}
