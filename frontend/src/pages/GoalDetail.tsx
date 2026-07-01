import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Lucide from 'lucide-react'
import {
  ArrowLeft,
  PiggyBank,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { goalService } from '@/services/goalService'
import { transactionService } from '@/services/transactionService'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { formatCurrency, formatDate, calculateDaysLeft } from '@/utils/format'
import { pageVariants, slideUp, scaleIn } from '@/animations/index'
import type { Transaction } from '@/types'

const themeConfig: Record<string, {
  gradient: string
  progressColor: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'pink'
  iconColor: string
}> = {
  emerald: { gradient: 'from-emerald-500 to-emerald-700', progressColor: 'emerald', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  blue: { gradient: 'from-blue-500 to-blue-700', progressColor: 'blue', iconColor: 'text-blue-600 dark:text-blue-400' },
  amber: { gradient: 'from-amber-500 to-amber-700', progressColor: 'amber', iconColor: 'text-amber-600 dark:text-amber-400' },
  red: { gradient: 'from-red-500 to-red-700', progressColor: 'red', iconColor: 'text-red-600 dark:text-red-400' },
  purple: { gradient: 'from-purple-500 to-purple-700', progressColor: 'purple', iconColor: 'text-purple-600 dark:text-purple-400' },
  pink: { gradient: 'from-pink-500 to-pink-700', progressColor: 'pink', iconColor: 'text-pink-600 dark:text-pink-400' },
}

const celebrationColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500',
  'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-rose-500',
]

function getGoalIcon(iconName: string, className?: string) {
  const Icon = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  return Icon ? <Icon className={className} /> : <PiggyBank className={className} />
}

function getPriorityBadge(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': return { variant: 'error' as const, label: 'High' }
    case 'medium': return { variant: 'warning' as const, label: 'Medium' }
    case 'low': return { variant: 'info' as const, label: 'Low' }
    default: return { variant: 'info' as const, label: priority || 'None' }
  }
}

function ConfettiParticle({ color, delay }: { color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      animate={{
        opacity: [1, 0.8, 0],
        y: [0, -200 - Math.random() * 200],
        x: [0, (Math.random() - 0.5) * 300],
        scale: [1, 1.5, 0],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
      }}
      transition={{ duration: 1.5 + Math.random(), delay, ease: 'easeOut' }}
      className={cn('absolute size-2.5 rounded-full', color)}
    />
  )
}

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const goalId = Number(id)

  const {
    data: goalData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalService.get(goalId),
    enabled: !isNaN(goalId),
  })

  const {
    data: txData,
    isLoading: txLoading,
  } = useQuery({
    queryKey: ['transactions', 'goal', goalId],
    queryFn: () => transactionService.list({ goal_id: goalId, per_page: 20, sort_by: 'transaction_date', sort_order: 'desc' }),
    enabled: !isNaN(goalId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => goalService.delete(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      navigate('/goals', { replace: true })
    },
  })

  const goal = goalData?.goal
  const transactions = txData?.transactions ?? []
  const isCompleted = goal?.completed ?? false
  const theme = themeConfig[goal?.color_theme ?? ''] ?? themeConfig.emerald
  const daysLeft = calculateDaysLeft(goal?.deadline ?? null)
  const priority = getPriorityBadge(goal?.priority ?? '')
  const percentage = goal ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0
  const remaining = goal ? Math.max(0, goal.target_amount - goal.current_amount) : 0

  const estimatedCompletion = useMemo(() => {
    if (!goal || goal.completed || remaining <= 0) return null
    const startDate = goal.created_at ? new Date(goal.created_at) : null
    if (!startDate) return null
    const daysSinceStart = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    const savedPerDay = goal.current_amount / daysSinceStart
    if (savedPerDay <= 0) return null
    const daysNeeded = Math.ceil(remaining / savedPerDay)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + daysNeeded)
    return {
      date: estimatedDate,
      days: daysNeeded,
      perDay: savedPerDay,
    }
  }, [goal])

  function handleDelete() {
    setShowDeleteModal(false)
    deleteMutation.mutate()
  }

  function handleAddToGoal() {
    navigate(`/add?goal_id=${goalId}`)
  }

  function handleWithdraw() {
    navigate(`/withdraw?goal_id=${goalId}`)
  }

  if (isLoading) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4 space-y-4"
      >
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <SkeletonCard />
        <SkeletonCard />
      </motion.main>
    )
  }

  if (isError || !goal) {
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
            Goal not found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This goal could not be loaded.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate('/goals')}>
              Back to Goals
            </Button>
            <Button variant="primary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
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
      className="pb-28 px-4 pt-4 space-y-5 relative"
    >
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              color={celebrationColors[i % celebrationColors.length]}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <button
          type="button"
          onClick={() => navigate('/goals')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Goals
        </button>
      </motion.div>

      <motion.div variants={scaleIn} initial="initial" animate="animate">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl p-6 shadow-lg',
            isCompleted
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
              : `bg-gradient-to-br ${theme.gradient}`,
          )}
        >
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4"
            >
              <CheckCircle2 className="size-8 text-white/80" />
            </motion.div>
          )}

          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-6 -right-6 size-32 rounded-full bg-white" />
            <div className="absolute -bottom-8 -left-8 size-40 rounded-full bg-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/20">
                {getGoalIcon(goal.icon, 'size-6 text-white')}
              </div>
              <h1 className="text-xl font-bold text-white">{goal.title}</h1>
            </div>

            <div className="mb-4">
              <ProgressBar
                value={goal.current_amount}
                max={goal.target_amount}
                color={isCompleted ? 'emerald' : theme.progressColor}
                size="lg"
                showPercentage
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Current
                </p>
                <AnimatedCounter
                  value={goal.current_amount}
                  className="text-2xl font-bold text-white"
                />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Target
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(goal.target_amount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white/90">
                <TrendingUp className="size-3.5" />
                <span>{percentage}% complete</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white/90">
                <Clock className="size-3.5" />
                <span>{remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Fully saved!'}</span>
              </div>
            </div>

            {goal.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <Calendar className="size-3.5" />
                <span>
                  Due {formatDate(goal.deadline)}
                  {daysLeft > 0 ? ` (${daysLeft} days left)` : ' (Overdue)'}
                </span>
              </div>
            )}
            {estimatedCompletion && !goal.completed && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-200 mt-2">
                <TrendingUp className="size-3.5" />
                <span>
                  Est. completion: {formatDate(estimatedCompletion.date.toISOString())} ({estimatedCompletion.days} days)
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={priority.variant} size="md" dot>
              {priority.label} Priority
            </Badge>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/goals/edit/${goal.id}`)}
              className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <Edit3 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <div className="flex gap-3">
          <Button
            variant="primary"
            leftIcon={<Plus className="size-4" />}
            fullWidth
            onClick={handleAddToGoal}
          >
            Add to this Goal
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Minus className="size-4" />}
            fullWidth
            onClick={handleWithdraw}
          >
            Withdraw
          </Button>
        </div>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Recent Transactions
        </h2>
        {txLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-2.5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card variant="glass" padding="md" className="text-center py-6">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <TrendingUp className="size-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              No transactions yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Start saving towards this goal
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: Transaction) => (
              <Card key={tx.id} variant="glass" padding="sm">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      tx.type === 'deposit'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40'
                        : 'bg-red-100 dark:bg-red-900/40',
                    )}
                  >
                    {tx.type === 'deposit' ? (
                      <Plus className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Minus className="size-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tx.description || (tx.type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatDate(tx.transaction_date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums shrink-0',
                      tx.type === 'deposit'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {tx.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Goal"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
            <Trash2 className="size-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete &quot;{goal.title}&quot;? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {isCompleted && !showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
        >
          <Button
            variant="primary"
            leftIcon={<CheckCircle2 className="size-4" />}
            onClick={() => setShowCelebration(true)}
            className="shadow-2xl"
          >
            Celebrate!
          </Button>
        </motion.div>
      )}
    </motion.main>
  )
}
