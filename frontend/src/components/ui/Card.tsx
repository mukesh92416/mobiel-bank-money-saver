import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const variants = {
  glass:
    'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-lg',
  gradient:
    'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg',
  elevated:
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl',
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

type CardVariant = keyof typeof variants
type CardPadding = keyof typeof paddings

interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  gradientBorder?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}

export function Card({
  variant = 'glass',
  padding = 'md',
  gradientBorder = false,
  onClick,
  className,
  children,
}: CardProps) {
  const Component = onClick ? motion.div : 'div'
  const motionProps = onClick
    ? {
        whileHover: { scale: 1.01 },
        whileTap: { scale: 0.99 },
        role: 'button' as const,
        tabIndex: 0 as const,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') onClick()
        },
      }
    : {}

  return (
    <Component
      className={cn(
        'rounded-2xl transition-all duration-200',
        variants[variant],
        paddings[padding],
        gradientBorder &&
          'relative border-transparent bg-clip-padding before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-emerald-400 before:to-emerald-600',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  )
}
