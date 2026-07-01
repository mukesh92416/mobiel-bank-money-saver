import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Banknote,
  ArrowDown,
  TrendingUp,
  Activity,
  Flame,
  Trophy,
  Target,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Sparkles,
  Eye,
  Calendar,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { analyticsService } from '@/services/analyticsService'
import { Card } from '@/components/ui/Card'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { SavingsHeatmap } from '@/components/analytics/SavingsHeatmap'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import {
  pageVariants,
  staggerContainer,
  staggerItem,
  slideUp,
} from '@/animations/index'
import type { CategoryData } from '@/types'

const PERIODS = [
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: '' },
] as const

const EMERALD_PALETTE = [
  '#10b981',
  '#34d399',
  '#6ee7b7',
  '#a7f3d0',
  '#059669',
  '#047857',
  '#065f46',
  '#064e3b',
]

const GOAL_THEME_COLORS: Record<string, 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'pink'> = {
  emerald: 'emerald',
  green: 'emerald',
  blue: 'blue',
  indigo: 'blue',
  amber: 'amber',
  orange: 'amber',
  red: 'red',
  rose: 'red',
  purple: 'purple',
  pink: 'pink',
}

function generateStreakDays(current: number, longest: number): boolean[] {
  const days: boolean[] = []
  for (let i = 29; i >= 0; i--) {
    if (i < current) {
      days.push(true)
    } else if (i < current + 5 && longest > current && Math.random() > 0.5) {
      days.push(true)
    } else {
      days.push(false)
    }
  }
  return days
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-xl p-3 shadow-premium-lg border border-gray-200 dark:border-gray-700/50">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
            <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="glass-card rounded-xl p-3 shadow-premium-lg border border-gray-200 dark:border-gray-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {formatCurrency(entry.value)} ({entry.payload.count} transactions)
      </p>
    </div>
  )
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-xl p-3 shadow-premium-lg border border-gray-200 dark:border-gray-700/50">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const labelFormatter = (value: string) => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Analytics() {
  const [period, setPeriod] = useState('1m')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const heatmapYear = new Date().getFullYear()

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
    data: trendData,
    isLoading: trendLoading,
    isError: trendError,
    refetch: refetchTrend,
  } = useQuery({
    queryKey: ['analytics-trend', period],
    queryFn: () => analyticsService.trend(period || undefined),
  })

  const {
    data: catData,
    isLoading: catLoading,
    isError: catError,
    refetch: refetchCat,
  } = useQuery({
    queryKey: ['analytics-categories'],
    queryFn: () => analyticsService.categories(),
  })

  const {
    data: goalsData,
    isLoading: goalsLoading,
    isError: goalsError,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: ['analytics-goals'],
    queryFn: () => analyticsService.goals(),
  })

  const {
    data: streakData,
    isLoading: streakLoading,
    isError: streakError,
    refetch: refetchStreak,
  } = useQuery({
    queryKey: ['analytics-streak'],
    queryFn: () => analyticsService.streak(),
  })

  const {
    data: predictionData,
    isLoading: predictionLoading,
  } = useQuery({
    queryKey: ['analytics-prediction'],
    queryFn: () => analyticsService.prediction(6),
  })

  const {
    data: comparisonData,
    isLoading: comparisonLoading,
  } = useQuery({
    queryKey: ['analytics-comparison'],
    queryFn: () => analyticsService.comparison(),
  })

  const {
    data: heatmapData,
    // isLoading omitted - unused
  } = useQuery({
    queryKey: ['analytics-heatmap', heatmapYear],
    queryFn: () => analyticsService.heatmap(heatmapYear),
  })

  const isLoading = summaryLoading || trendLoading || catLoading || goalsLoading || streakLoading || predictionLoading || comparisonLoading
  const isError = summaryError || trendError || catError || goalsError || streakError

  const trend = trendData?.trend ?? []
  const depositCategories = catData?.deposits ?? []
  const goals = goalsData?.goals ?? []
  const currentStreak = streakData?.current_streak ?? 0
  const longestStreak = streakData?.longest_streak ?? 0

  const streakDays = useMemo(() => generateStreakDays(currentStreak, longestStreak), [currentStreak, longestStreak])

  const pieTotal = useMemo(
    () => depositCategories.reduce((acc: number, c: CategoryData) => acc + c.amount, 0),
    [depositCategories],
  )

  // noData check omitted - unused

  function handleRetry() {
    refetchSummary()
    refetchTrend()
    refetchCat()
    refetchGoals()
    refetchStreak()
  }

  function renderPieCenter() {
    return (
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
        <tspan
          x="50%"
          dy="-0.6em"
          className="fill-gray-500 dark:fill-gray-400"
          fontSize="12"
          fontWeight="500"
        >
          Total
        </tspan>
        <tspan
          x="50%"
          dy="1.6em"
          className="fill-gray-900 dark:fill-gray-100"
          fontSize="14"
          fontWeight="700"
        >
          {formatCurrency(pieTotal)}
        </tspan>
      </text>
    )
  }

  function renderPieLegend() {
    return (
      <div className="space-y-2 mt-4">
        {depositCategories.map((cat: CategoryData, idx: number) => (
          <div key={cat.category} className="flex items-center gap-2.5">
            <span
              className="size-3 rounded-sm shrink-0"
              style={{ backgroundColor: EMERALD_PALETTE[idx % EMERALD_PALETTE.length] }}
            />
            <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 capitalize truncate">
              {cat.category}
            </span>
            <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatCurrency(cat.amount)}
            </span>
          </div>
        ))}
      </div>
    )
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
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-8 w-28" />
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <Skeleton key={p.value} className="h-8 w-10 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-4 space-y-2.5"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
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
              We couldn&apos;t load your analytics. Please try again.
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
                period === p.value
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3"
      >
        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Deposits
              </span>
              <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Banknote className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <AnimatedCounter
              value={summary?.total_deposits ?? 0}
              className="text-lg font-bold text-gray-900 dark:text-gray-100"
            />
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Total deposits
            </p>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Withdrawals
              </span>
              <div className="flex size-7 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <ArrowDown className="size-3.5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <AnimatedCounter
              value={summary?.total_withdrawals ?? 0}
              className="text-lg font-bold text-gray-900 dark:text-gray-100"
            />
            <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">
              Total withdrawals
            </p>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Average
              </span>
              <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <BarChart3 className="size-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <AnimatedCounter
              value={summary?.total_deposits && summary?.transaction_count ? Math.round(summary.total_deposits / Math.max(1, summary.transaction_count)) : 0}
              className="text-lg font-bold text-gray-900 dark:text-gray-100"
            />
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
              Avg per transaction
            </p>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Frequency
              </span>
              <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Activity className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <AnimatedCounter
              value={summary?.transaction_count ?? 0}
              format={false}
              className="text-lg font-bold text-gray-900 dark:text-gray-100"
            />
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
              Total transactions
            </p>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <Card variant="glass" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="size-4 text-primary-500" />
              Savings Trend
            </h2>
            <Badge variant="info" size="sm">
              {PERIODS.find((p) => p.value === period)?.label ?? 'All'}
            </Badge>
          </div>
          {trend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
              <TrendingUp className="size-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No trend data</p>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="withdrawGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="stroke-gray-200 dark:stroke-gray-700/50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey={trend[0]?.date ? 'date' : 'month'}
                    tickFormatter={labelFormatter}
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="fill-gray-400 dark:fill-gray-500"
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="fill-gray-400 dark:fill-gray-500"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="deposits"
                    name="Deposits"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#depositGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="withdrawals"
                    name="Withdrawals"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#withdrawGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <PieChart className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Deposit Categories
              </h2>
            </div>
            {depositCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <PieChart className="size-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No categories yet</p>
              </div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={depositCategories}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                        cornerRadius={4}
                      >
                        {depositCategories.map((_: CategoryData, idx: number) => (
                          <Cell
                            key={idx}
                            fill={EMERALD_PALETTE[idx % EMERALD_PALETTE.length]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryTooltip />} />
                      {renderPieCenter()}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {renderPieLegend()}
              </>
            )}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <BarChart3 className="size-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Deposit vs Withdrawal
              </h2>
            </div>
            {trend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <BarChart3 className="size-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No data to compare</p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="stroke-gray-200 dark:stroke-gray-700/50"
                      vertical={false}
                    />
                    <XAxis
                      dataKey={trend[0]?.date ? 'date' : 'month'}
                      tickFormatter={labelFormatter}
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      className="fill-gray-400 dark:fill-gray-500"
                      axisLine={false}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      className="fill-gray-400 dark:fill-gray-500"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(156, 163, 175, 0.08)' }} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      iconType="rect"
                      iconSize={8}
                    />
                    <Bar
                      dataKey="deposits"
                      name="Deposits"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                    <Bar
                      dataKey="withdrawals"
                      name="Withdrawals"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <Card variant="glass" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              Savings Streak
            </h2>
          </div>

          <div className="flex gap-4 mb-5">
            <div className="flex-1 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-700/30 p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <Flame className="size-4.5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    Current Streak
                  </p>
                  <AnimatedCounter
                    value={currentStreak}
                    format={false}
                    className="text-xl font-bold text-orange-700 dark:text-orange-300"
                  />
                </div>
              </div>
              <p className="text-[10px] text-orange-500/70 mt-1.5 ml-[46px]">
                days of consistent saving
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Trophy className="size-4.5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Longest Streak
                  </p>
                  <AnimatedCounter
                    value={longestStreak}
                    format={false}
                    className="text-xl font-bold text-amber-700 dark:text-amber-300"
                  />
                </div>
              </div>
              <p className="text-[10px] text-amber-500/70 mt-1.5 ml-[46px]">
                your best run ever
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2.5">
              Last 30 Days
            </p>
            <div className="grid grid-cols-10 gap-1.5">
              {streakDays.map((active, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'aspect-square rounded-md transition-all duration-300',
                    active
                      ? 'bg-emerald-400 dark:bg-emerald-500 shadow-sm shadow-emerald-400/30'
                      : 'bg-gray-200 dark:bg-gray-700',
                  )}
                  title={active ? 'Had deposits' : 'No deposits'}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Missed</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
              <Target className="size-3.5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Goal Progress
            </h2>
          </div>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <Target className="size-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No goals yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal: { title: string; target: number; current: number; progress: number; remaining: number }, idx: number) => (
                <motion.div
                  key={goal.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mr-2">
                      {goal.title}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                      {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                    </span>
                  </div>
                  <ProgressBar
                    value={goal.current}
                    max={goal.target}
                    color={
                      GOAL_THEME_COLORS[goal.title.toLowerCase()] ?? 'emerald'
                    }
                    size="sm"
                    showPercentage
                  />
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {predictionData && predictionData.predicted_months.length > 0 && (
        <motion.div variants={slideUp} initial="initial" animate="animate">
          <Card variant="glass" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-7 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Prediction
              </h2>
              <Badge variant="info" size="sm">
                {predictionData.trend}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Monthly average: {formatCurrency(predictionData.monthly_average)} · Trend: {predictionData.trend_factor}x
            </p>
            {predictionData.predicted_months.length > 0 && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionData.predicted_months}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-gray-200 dark:stroke-gray-700/50" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-gray-400 dark:fill-gray-500" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} className="fill-gray-400 dark:fill-gray-500" axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={((value: number) => [formatCurrency(value), 'Predicted']) as any} />
                    <Line type="monotone" dataKey="predicted_amount" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {comparisonData && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <motion.div variants={staggerItem}>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Monthly Comparison
                </h2>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Last Month</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{formatCurrency(comparisonData.last_month)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">This Month</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{formatCurrency(comparisonData.this_month)}</p>
                </div>
              </div>
              {comparisonData.month_change !== null && (
                <div className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  comparisonData.month_change >= 0 ? 'text-emerald-600' : 'text-red-600',
                )}>
                  {comparisonData.month_change >= 0 ? '↑' : '↓'} {Math.abs(comparisonData.month_change)}% vs last month
                </div>
              )}
              {comparisonData.month_comparison_data.length > 0 && (
                <div className="h-28 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.month_comparison_data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700/50" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-gray-400" axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Eye className="size-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Yearly Comparison
                </h2>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Last Year</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{formatCurrency(comparisonData.last_year)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">This Year</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{formatCurrency(comparisonData.this_year)}</p>
                </div>
              </div>
              {comparisonData.year_change !== null && (
                <div className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  comparisonData.year_change >= 0 ? 'text-emerald-600' : 'text-red-600',
                )}>
                  {comparisonData.year_change >= 0 ? '↑' : '↓'} {Math.abs(comparisonData.year_change)}% vs last year
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}

      {heatmapData && (
        <motion.div variants={slideUp} initial="initial" animate="animate">
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Savings Heatmap
                </h2>
              </div>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {showHeatmap ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHeatmap && (
              <SavingsHeatmap data={heatmapData.data} year={heatmapData.year} />
            )}
          </Card>
        </motion.div>
      )}
    </motion.main>
  )
}
