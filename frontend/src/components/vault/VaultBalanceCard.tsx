import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Calendar, TrendingUp, Wallet, Target, Sparkles } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface VaultBalanceCardProps {
  balance: number
  todayDeposits: number
  weeklyDeposits: number
  monthlyDeposits: number
  yearlyDeposits: number
  transactionCount: number
  goalCount: number
  monthlyGoal?: number
  monthlyProgress?: number
}

export function VaultBalanceCard({
  balance,
  todayDeposits,
  weeklyDeposits,
  monthlyDeposits,
  yearlyDeposits,
  transactionCount,
  goalCount,
  monthlyGoal = 0,
  monthlyProgress = 0,
}: VaultBalanceCardProps) {
  const statPills = [
    { label: 'Today', value: todayDeposits, icon: Calendar },
    { label: 'Week', value: weeklyDeposits, icon: TrendingUp },
    { label: 'Month', value: monthlyDeposits, icon: TrendingUp },
    { label: 'Year', value: yearlyDeposits, icon: ArrowUpRight },
  ]

  const milestoneLabel = useMemo(() => {
    if (balance >= 100000) return 'Lakhpati!'
    if (balance >= 50000) return 'Half Lakh!'
    if (balance >= 10000) return '10K Club!'
    if (balance >= 5000) return '5K Club!'
    if (balance >= 1000) return '1K Club!'
    return null
  }, [balance])

  const bgGradient = useMemo(() => {
    if (balance >= 100000) return 'from-amber-600 via-amber-500 to-yellow-600'
    if (balance >= 50000) return 'from-emerald-600 to-teal-600'
    return 'from-emerald-600 to-teal-600'
  }, [balance])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} p-6 shadow-2xl shadow-emerald-600/20`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      <motion.div
        className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/5"
        animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <Wallet className="size-3.5 text-white" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.12em] text-emerald-100/80 uppercase">
              Vault Balance
            </span>
          </div>
          {milestoneLabel && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white"
            >
              <Sparkles className="size-3" />
              {milestoneLabel}
            </motion.div>
          )}
        </div>

        <AnimatedCounter
          value={balance}
          className="text-4xl font-bold text-white tracking-tight"
        />

        <div className="grid grid-cols-4 gap-2">
          {statPills.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-1.5 py-2 backdrop-blur-sm"
            >
              <Icon className="size-3 text-emerald-200/70" />
              <AnimatedCounter
                value={value}
                format={false}
                className="text-sm font-bold text-white leading-none"
              />
              <span className="text-[10px] font-medium text-emerald-200/70 uppercase leading-none">
                {label}
              </span>
            </div>
          ))}
        </div>

        {monthlyGoal > 0 && (
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-100/80">
                <Target className="size-3" />
                Monthly Progress
              </span>
              <span className="text-[10px] font-bold text-white">
                {Math.round(monthlyProgress)}%
              </span>
            </div>
            <ProgressBar
              value={monthlyProgress}
              max={100}
              color="emerald"
              size="sm"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            <span className="text-emerald-100">{transactionCount} transactions</span>
          </Badge>
          <Badge variant="info" size="sm">
            <span className="text-blue-100">{goalCount} goals</span>
          </Badge>
        </div>
      </div>
    </motion.div>
  )
}
