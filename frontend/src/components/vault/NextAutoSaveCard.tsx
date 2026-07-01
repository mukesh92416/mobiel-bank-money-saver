import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Settings, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/format'
import type { AutoSaveSchedule } from '@/types'

interface NextAutoSaveCardProps {
  nextSchedule: AutoSaveSchedule | null
}

const frequencyLabels: Record<string, string> = {
  daily: 'Every Day',
  weekly: 'Every Week',
  monthly: 'Every Month',
  salary: 'Salary Day',
  custom: 'Custom',
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft('Due now')
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      if (days > 0) setTimeLeft(`${days}d ${hours}h`)
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`)
      else setTimeLeft(`${mins}m`)
    }
    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [targetDate])

  return <span>{timeLeft}</span>
}

export function NextAutoSaveCard({ nextSchedule }: NextAutoSaveCardProps) {
  const navigate = useNavigate()

  if (!nextSchedule) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      >
        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Clock className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Set up auto-save
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Automate your savings effortlessly
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/auto-save')}
            >
              <Settings className="size-3.5" />
              Configure
            </Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
    >
      <Card variant="glass" padding="md">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Clock className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Next Auto-Save
            </p>
            <div className="mt-1.5 space-y-1">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(nextSchedule.amount)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {frequencyLabels[nextSchedule.frequency] ?? nextSchedule.frequency}
              </p>
              {nextSchedule.next_trigger && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  <CountdownTimer targetDate={nextSchedule.next_trigger} /> · {formatDate(nextSchedule.next_trigger)}
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/add?amount=${nextSchedule.amount}`)}
                leftIcon={<Zap className="size-3.5" />}
              >
                Save now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nextSchedule.goal_id ? navigate(`/goals/${nextSchedule.goal_id}`) : navigate('/auto-save')}
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
