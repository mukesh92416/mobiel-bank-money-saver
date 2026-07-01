import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PiggyBank,
  ArrowUp,
  ArrowDown,
  ArrowDownFromLine,
  Plus,
  HandCoins,
  Wallet,
  Target,
  User,
  RefreshCw,
  AlertCircle,
  Zap,
  RotateCcw,
} from 'lucide-react'
import { analyticsService } from '@/services/analyticsService'
import { goalService } from '@/services/goalService'
import { transactionService } from '@/services/transactionService'
import { autoSaveService } from '@/services/autoSaveService'
import { useAuthStore } from '@/store/authStore'
import { useQuickSaveStore } from '@/store/quickSaveStore'
import { QuickSaveSheet } from '@/components/quickSave/QuickSaveSheet'
import { QuickWithdrawSheet } from '@/components/quickSave/QuickWithdrawSheet'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DashboardCardSkeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { VaultBalanceCard } from '@/components/vault/VaultBalanceCard'
import SavingsInsights from '@/components/analytics/SavingsInsights'
import { SavingsStreakDisplay } from '@/components/vault/SavingsStreakDisplay'
import { NextAutoSaveCard } from '@/components/vault/NextAutoSaveCard'
import { cn } from '@/utils/cn'
import { formatCurrency, getGreeting, getRelativeTime } from '@/utils/format'
import {
  pageVariants,
  slideUp,
  scaleIn,
} from '@/animations/index'

const motivationalQuotes = [
  'A penny saved is a penny earned.',
  'Do not save what is left after spending, but spend what is left after saving.',
  'The habit of saving is itself an education.',
  'Beware of little expenses. A small leak will sink a great ship.',
  'Wealth consists not in having great possessions, but in having few wants.',
  'Financial freedom is available to those who learn about it and work for it.',
  'Saving money is a form of freedom.',
  'The best time to start saving was yesterday. The next best time is now.',
]

const goalColorMap: Record<string, 'emerald' | 'blue' | 'amber' | 'red'> = {
  emerald: 'emerald',
  green: 'emerald',
  blue: 'blue',
  indigo: 'blue',
  amber: 'amber',
  orange: 'amber',
  red: 'red',
  rose: 'red',
}

function getGoalColor(theme: string) {
  return goalColorMap[theme.toLowerCase()] ?? 'emerald'
}

const today = new Date()
const formattedToday = today.toLocaleDateString('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([])
  const [quickSaveOpen, setQuickSaveOpen] = useState(false)
  const [quickWithdrawOpen, setQuickWithdrawOpen] = useState(false)
  const lastSave = useQuickSaveStore((s) => s.lastSave)
  const lastWithdraw = useQuickSaveStore((s) => s.lastWithdraw)
  const presets = useQuickSaveStore((s) => s.presets)
  const withdrawPresets = useQuickSaveStore((s) => s.withdrawPresets)

  const quote = useMemo(
    () => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)],
    [],
  )

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsService.summary(),
  })

  const {
    data: goalsData,
    isLoading: goalsLoading,
    isError: goalsError,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.list(),
  })

  const {
    data: txData,
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['transactions-recent'],
    queryFn: () => transactionService.list({ per_page: 5, sort_by: 'transaction_date', sort_order: 'desc' }),
  })

  const { data: streakData } = useQuery({
    queryKey: ['analytics-streak'],
    queryFn: () => analyticsService.streak(),
  })

  const { data: nextAutoSave } = useQuery({
    queryKey: ['auto-save-next'],
    queryFn: () => autoSaveService.getNext(),
  })

  const isLoading = summaryLoading || goalsLoading || txLoading
  const isError = summaryError || goalsError || txError

  const goals = goalsData?.goals ?? []
  const transactions = txData?.transactions ?? []
  const balance = summary?.balance ?? 0

  function handleFabAction(path: string) {
    setIsFabOpen(false)
    navigate(path)
  }

  function handleRetry() {
    refetchSummary()
    refetchGoals()
    refetchTx()
  }

  if (isLoading) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4 space-y-5"
      >
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2.5">
              <div className="h-4 w-44 skeleton rounded" />
              <div className="h-3 w-36 skeleton rounded" />
              <div className="h-3 w-56 skeleton rounded" />
            </div>
            <div className="size-12 skeleton rounded-full" />
          </div>
        </div>
        <DashboardCardSkeleton />
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
        <SkeletonCard />
        <SkeletonCard />
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
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              We couldn&apos;t load your dashboard. Please try again.
            </p>
            <Button variant="primary" leftIcon={<RefreshCw className="size-4" />} onClick={handleRetry}>
              Retry
            </Button>
          </motion.div>
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
      <motion.div variants={slideUp} initial="initial" animate="animate">
        <Card variant="glass" padding="md" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'}!
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {formattedToday}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 italic mt-2 leading-relaxed line-clamp-2">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
            <div className="shrink-0 ml-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="size-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm font-bold ring-2 ring-primary-500/30 shadow-lg shadow-primary-500/20">
                  {initials ?? <User className="size-5" />}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={scaleIn} initial="initial" animate="animate">
        <VaultBalanceCard
          balance={balance}
          todayDeposits={summary?.today_deposits ?? 0}
          weeklyDeposits={summary?.weekly_deposits ?? 0}
          monthlyDeposits={summary?.monthly_deposits ?? 0}
          yearlyDeposits={summary?.yearly_deposits ?? 0}
          transactionCount={summary?.transaction_count ?? 0}
          goalCount={goals.length}
          monthlyGoal={summary?.monthly_deposits ?? 0}
          monthlyProgress={summary?.monthly_deposits && summary?.total_deposits ? Math.min((summary.monthly_deposits / (summary.total_deposits / Math.max(1, Math.ceil((summary.monthly_deposits > 0 ? (summary.total_deposits / summary.monthly_deposits) : 1)))) * 100), 100) : 0}
        />
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/add')}
            className={cn(
              'group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300',
              'bg-gradient-to-br from-emerald-500 to-emerald-700',
              'shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2',
            )}
            aria-label="Add Money - Save to your Vault"
          >
            <div className="absolute inset-0 opacity-[0.08]">
              <div className="absolute -top-4 -right-4 size-20 rounded-full bg-white" />
              <div className="absolute -bottom-6 -left-6 size-28 rounded-full bg-white" />
            </div>
            <div className="relative z-10">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/20 mb-3">
                <Wallet className="size-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white">Add Money</p>
              <p className="text-xs text-emerald-100/80 mt-1">Save to your Vault</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/withdraw')}
            className={cn(
              'group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300',
              'bg-gradient-to-br from-red-500 to-orange-600',
              'shadow-lg shadow-red-500/25 hover:shadow-red-500/40',
              'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2',
            )}
            aria-label="Withdraw - Transfer Back"
          >
            <div className="absolute inset-0 opacity-[0.08]">
              <div className="absolute -top-4 -right-4 size-20 rounded-full bg-white" />
              <div className="absolute -bottom-6 -left-6 size-28 rounded-full bg-white" />
            </div>
            <div className="relative z-10">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/20 mb-3">
                <ArrowDownFromLine className="size-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white">Withdraw</p>
              <p className="text-xs text-red-100/80 mt-1">Transfer Back</p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      <SavingsStreakDisplay
        currentStreak={streakData?.current_streak ?? 0}
        longestStreak={streakData?.longest_streak ?? 0}
      />

      <NextAutoSaveCard nextSchedule={nextAutoSave?.next ?? null} />

      <SavingsInsights
        transactions={transactions}
        goals={goals}
        summary={summary ?? null}
        streak={streakData ?? null}
        dismissedIds={dismissedInsights}
        onDismiss={(id) => setDismissedInsights((prev) => [...prev, id])}
      />

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Quick Save
          </h2>
          <button
            onClick={() => setQuickSaveOpen(true)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            See All
          </button>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {presets.filter(p => p.id !== 'qs-custom' && p.amount > 0).slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => { setQuickSaveOpen(true) }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <Zap className="size-3.5" />
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setQuickSaveOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-400"
          >
            <Plus className="size-3.5" />
            Custom
          </button>
        </div>
        {lastSave && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setQuickSaveOpen(true) }}
            className="flex items-center gap-3 w-full mt-3 rounded-xl px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Save Again
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last save: {formatCurrency(lastSave.amount)}
              </p>
            </div>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(lastSave.amount)}
            </span>
          </motion.button>
        )}
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Quick Withdraw
          </h2>
          <button
            onClick={() => setQuickWithdrawOpen(true)}
            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            See All
          </button>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {withdrawPresets.filter(p => p.id !== 'wd-custom' && p.amount > 0).slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setQuickWithdrawOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/25 hover:shadow-red-500/40"
            >
              <ArrowDownFromLine className="size-3.5" />
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setQuickWithdrawOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-400"
          >
            <Plus className="size-3.5" />
            Custom
          </button>
        </div>
        {lastWithdraw && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setQuickWithdrawOpen(true)}
            className="flex items-center gap-3 w-full mt-3 rounded-xl px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30 transition-all"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <RotateCcw className="size-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Withdraw Again
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last withdraw: {formatCurrency(lastWithdraw.amount)}
              </p>
            </div>
            <span className="text-base font-bold text-red-600 dark:text-red-400">
              {formatCurrency(lastWithdraw.amount)}
            </span>
          </motion.button>
        )}
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Your Goals
          </h2>
          <Link
            to="/goals"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            See All
          </Link>
        </div>
        {goals.length === 0 ? (
          <Card variant="glass" padding="md" className="text-center py-6">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-800">
              <Target className="size-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              No goals yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Create your first savings goal
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <motion.div key={goal.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link to={`/goals`} className="block">
                  <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-full',
                          goal.color_theme === 'blue' && 'bg-blue-100 dark:bg-blue-900/40',
                          goal.color_theme === 'amber' && 'bg-amber-100 dark:bg-amber-900/40',
                          goal.color_theme === 'red' && 'bg-red-100 dark:bg-red-900/40',
                          (!goal.color_theme || goal.color_theme === 'emerald') &&
                            'bg-emerald-100 dark:bg-emerald-900/40',
                        )}
                      >
                        <PiggyBank
                          className={cn(
                            'size-4',
                            goal.color_theme === 'blue' && 'text-blue-600 dark:text-blue-400',
                            goal.color_theme === 'amber' && 'text-amber-600 dark:text-amber-400',
                            goal.color_theme === 'red' && 'text-red-600 dark:text-red-400',
                            (!goal.color_theme || goal.color_theme === 'emerald') &&
                              'text-emerald-600 dark:text-emerald-400',
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {goal.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                      {goal.completed && (
                        <Badge variant="success" size="sm">Done</Badge>
                      )}
                    </div>
                    <ProgressBar
                      value={goal.current_amount}
                      max={goal.target_amount}
                      color={getGoalColor(goal.color_theme)}
                      size="sm"
                      showPercentage
                    />
                  </Card>
                </Link>
              </motion.div>
            ))}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <button
                type="button"
                onClick={() => navigate('/goals/new')}
                className="w-full"
              >
                <Card
                  variant="glass"
                  padding="md"
                  className="border-dashed border-2 border-gray-200 dark:border-dark-600 flex items-center justify-center gap-2 py-4 text-gray-400 hover:text-primary-500 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                >
                  <Plus className="size-4" />
                  <span className="text-sm font-medium">Quick Add Goal</span>
                </Card>
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Recent Activity
          </h2>
          <Link
            to="/history"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            View All
          </Link>
        </div>
        {transactions.length === 0 ? (
          <Card variant="glass" padding="md" className="text-center py-6">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-800">
              <Wallet className="size-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              No transactions yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Start saving to see your activity here
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card variant="glass" padding="sm">
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
                        <ArrowUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDown className="size-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {tx.description || (tx.type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                        </p>
                        <Badge
                          variant={tx.type === 'deposit' ? 'success' : 'error'}
                          size="sm"
                        >
                          {tx.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {getRelativeTime(tx.transaction_date)}
                        {tx.goal_title && ` · ${tx.goal_title}`}
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
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isFabOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsFabOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3"
            >
              <button
                type="button"
                onClick={() => handleFabAction('/add')}
                className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-dark-800 shadow-premium-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <HandCoins className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Add Money
              </button>
              <button
                type="button"
                onClick={() => handleFabAction('/withdraw')}
                className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-dark-800 shadow-premium-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <ArrowDown className="size-4 text-red-600 dark:text-red-400" />
                </div>
                Withdraw
              </button>
              <button
                type="button"
                onClick={() => handleFabAction('/goals/new')}
                className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-dark-800 shadow-premium-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Target className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                New Goal
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.35)' }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => setIsFabOpen((p) => !p)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 rounded-full transition-shadow',
          'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
          'shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:focus:ring-offset-dark-900',
        )}
        aria-label="Quick actions"
      >
        <motion.div
          animate={{ rotate: isFabOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="size-6" />
        </motion.div>
      </motion.button>

      <QuickSaveSheet open={quickSaveOpen} onClose={() => setQuickSaveOpen(false)} />
      <QuickWithdrawSheet open={quickWithdrawOpen} onClose={() => setQuickWithdrawOpen(false)} />
    </motion.main>
  )
}
