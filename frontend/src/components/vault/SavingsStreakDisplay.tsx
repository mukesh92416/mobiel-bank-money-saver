import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Zap, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface SavingsStreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const from = 0
    const range = value - from
    const duration = 1000
    const start = performance.now()

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + range * eased))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [value])

  return (
    <motion.span
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={cn('tabular-nums', className)}
    >
      {display}
    </motion.span>
  )
}

function getStreakMilestone(days: number): { label: string; color: string; bg: string } | null {
  if (days >= 90) return { label: '90 Days', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40' }
  if (days >= 60) return { label: '60 Days', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/40' }
  if (days >= 30) return { label: '30 Days', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' }
  if (days >= 14) return { label: '2 Weeks', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/40' }
  if (days >= 7) return { label: '1 Week', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' }
  return null
}

export function SavingsStreakDisplay({ currentStreak, longestStreak }: SavingsStreakDisplayProps) {
  const isEmpty = currentStreak === 0 && longestStreak === 0

  const milestone = useMemo(() => getStreakMilestone(currentStreak), [currentStreak])
  const predictionText = useMemo(() => {
    if (currentStreak === 0) return null
    const nextMilestones = [7, 14, 30, 60, 90].filter(m => m > currentStreak)
    if (nextMilestones.length > 0) {
      const daysToNext = nextMilestones[0] - currentStreak
      return `${daysToNext} more day${daysToNext > 1 ? 's' : ''} to ${nextMilestones[0]}-day milestone`
    }
    return null
  }, [currentStreak])

  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card variant="glass" padding="lg" className="text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/20"
            >
              <Flame className="size-6 text-orange-500 dark:text-orange-400" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                No streaks yet
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Start saving daily to build your streak!
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Card variant="glass" padding="md" className="text-center">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [1, 0.85, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                animate={currentStreak >= 7 ? { rotate: [0, -5, 5, -5, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br',
                  currentStreak >= 30
                    ? 'from-orange-400 to-red-500'
                    : currentStreak >= 14
                    ? 'from-orange-400 to-amber-500'
                    : 'from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/20',
                )}
              >
                <Flame className={cn(
                  'size-5',
                  currentStreak >= 14 ? 'text-white' : 'text-orange-500 dark:text-orange-400',
                )} />
              </motion.div>
            </motion.div>
            <AnimatedCount
              value={currentStreak}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            />
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Day Streak
            </span>
            {milestone && (
              <Badge variant="primary" size="sm" className={milestone.bg}>
                <Star className="size-2.5" />
                <span className={milestone.color}>{milestone.label}</span>
              </Badge>
            )}
          </div>
        </Card>

        <Card variant="glass" padding="md" className="text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/20">
              <Trophy className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AnimatedCount
              value={longestStreak}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            />
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Best Streak
            </span>
            {currentStreak === longestStreak && currentStreak > 0 && (
              <Badge variant="success" size="sm">
                <Zap className="size-2.5" />
                Personal Best
              </Badge>
            )}
          </div>
        </Card>
      </div>
      {predictionText && (
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
          {predictionText}
        </p>
      )}
    </motion.div>
  )
}
