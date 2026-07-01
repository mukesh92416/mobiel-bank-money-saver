import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  PiggyBank,
  Plus,
  CheckCircle2,
  Target,
  Clock,
  AlertCircle,
} from 'lucide-react'
import * as Lucide from 'lucide-react'
import { goalService } from '@/services/goalService'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import { formatCurrency, calculateDaysLeft } from '@/utils/format'
import { pageVariants, staggerContainer, staggerItem } from '@/animations/index'
import type { Goal } from '@/types'

const themeConfig: Record<string, { progressColor: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'pink'; badgeVariant: 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
  emerald: { progressColor: 'emerald', badgeVariant: 'success' },
  blue: { progressColor: 'blue', badgeVariant: 'info' },
  amber: { progressColor: 'amber', badgeVariant: 'warning' },
  red: { progressColor: 'red', badgeVariant: 'error' },
  purple: { progressColor: 'purple', badgeVariant: 'primary' },
  pink: { progressColor: 'pink', badgeVariant: 'primary' },
}

function getGoalIcon(iconName: string, className?: string) {
  const Icon = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  return Icon ? <Icon className={className} /> : <PiggyBank className={className} />
}

function getPriorityBadge(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high':
      return { variant: 'error' as const, label: 'High' }
    case 'medium':
      return { variant: 'warning' as const, label: 'Medium' }
    case 'low':
      return { variant: 'info' as const, label: 'Low' }
    default:
      return { variant: 'info' as const, label: priority || 'None' }
  }
}

export default function Goals() {
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.list(),
  })

  const goals = data?.goals ?? []

  if (isLoading) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4 space-y-5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="size-9 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </motion.main>
    )
  }

  if (isError) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4"
      >
        <Card variant="glass" padding="lg" className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Could not load your goals. Please try again.
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      </motion.main>
    )
  }

  return (
    <motion.main
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className="pb-28 px-4 pt-4 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Savings Goals
        </h1>
        <button
          type="button"
          onClick={() => navigate('/goals/new')}
          className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="size-12" />}
          title="No goals yet"
          description="Create your first savings goal!"
          actionLabel="Create Goal"
          onAction={() => navigate('/goals/new')}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {goals.map((goal: Goal) => {
            const theme = themeConfig[goal.color_theme] ?? themeConfig.emerald
            const daysLeft = calculateDaysLeft(goal.deadline)
            const priority = getPriorityBadge(goal.priority)

            return (
              <motion.div key={goal.id} variants={staggerItem}>
                <Card
                  variant="elevated"
                  padding="md"
                  onClick={() => navigate(`/goals/${goal.id}`)}
                  className={cn(
                    'relative overflow-hidden',
                    goal.completed && 'ring-2 ring-emerald-500/30',
                  )}
                >
                  {goal.completed && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="size-6 text-emerald-500" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        goal.color_theme === 'blue' && 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
                        goal.color_theme === 'amber' && 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
                        goal.color_theme === 'red' && 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
                        goal.color_theme === 'purple' && 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
                        goal.color_theme === 'pink' && 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
                        (!goal.color_theme || goal.color_theme === 'emerald') && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {getGoalIcon(goal.icon, 'size-5')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        'text-base font-semibold truncate',
                        goal.completed
                          ? 'text-gray-500 dark:text-gray-400 line-through'
                          : 'text-gray-900 dark:text-gray-100',
                      )}>
                        {goal.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                    <Badge variant={priority.variant} size="sm">
                      {priority.label}
                    </Badge>
                  </div>

                  <ProgressBar
                    value={goal.current_amount}
                    max={goal.target_amount}
                    color={theme.progressColor}
                    size="sm"
                    showPercentage
                    className="mb-3"
                  />

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2 min-w-0">
                      {goal.deadline ? (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 shrink-0" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                        </span>
                      ) : (
                        <span>No deadline</span>
                      )}
                      {goal.progress > 0 && goal.progress < 100 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          · {Math.round((goal.remaining / (goal.current_amount / Math.max(1, Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24))))))} days est.
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 shrink-0">
                      {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                    </span>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.main>
  )
}
