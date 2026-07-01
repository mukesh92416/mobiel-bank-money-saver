import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import * as Lucide from 'lucide-react'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Zap, Sparkles, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { staggerContainer, staggerItem, slideUp } from '@/animations'
import { generateInsights, type CoachInsight } from '@/services/aiCoachService'
import type { Transaction, Goal, AnalyticsSummary, StreakData } from '@/types'

const typeConfig: Record<CoachInsight['type'], { bg: string; iconBg: string; iconColor: string }> = {
  positive: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  negative: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  tip: {
    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, Zap, Lightbulb,
  Calendar: Lucide.Calendar,
  Target: Lucide.Target,
  Flame: Lucide.Flame,
  Bell: Lucide.Bell,
  BarChart3: Lucide.BarChart3,
}

interface Props {
  transactions: Transaction[]
  goals: Goal[]
  summary: AnalyticsSummary | null
  streak: StreakData | null
  onDismiss?: (id: string) => void
  dismissedIds?: string[]
}

export default function SavingsInsights({ transactions, goals, summary, streak, onDismiss, dismissedIds = [] }: Props) {
  const navigate = useNavigate()

  const insights = useMemo(() => {
    const all = generateInsights(transactions, goals, summary, streak)
    return all.filter((i) => !dismissedIds.includes(i.id))
  }, [transactions, goals, summary, streak, dismissedIds])

  if (insights.length === 0) return null

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      <motion.div variants={staggerItem}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          AI Insights
        </h2>
      </motion.div>
      {insights.map((insight) => {
        const config = typeConfig[insight.type]
        const IconComp = iconMap[insight.icon] || Lightbulb
        return (
          <motion.div
            key={insight.id}
            variants={staggerItem}
            layout
          >
            <Card
              variant="glass"
              padding="md"
              className={cn('border', config.bg)}
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', config.iconBg)}>
                  <IconComp className={cn('size-5', config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {insight.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {insight.message}
                  </p>
                  {insight.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 !text-xs !px-3 !py-1"
                      onClick={() => navigate(insight.action!.to)}
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(insight.id)}
                    className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
