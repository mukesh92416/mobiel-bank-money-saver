import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Clock,
  Zap,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { autoSaveService } from '@/services/autoSaveService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/format'
import { pageVariants, staggerContainer, staggerItem } from '@/animations/index'
import type { AutoSaveSchedule } from '@/types'

const frequencyConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'primary' | 'error' }> = {
  daily: { label: 'Daily', variant: 'info' },
  weekly: { label: 'Weekly', variant: 'warning' },
  monthly: { label: 'Monthly', variant: 'success' },
  salary: { label: 'Salary', variant: 'primary' },
  custom: { label: 'Custom', variant: 'error' },
}

export default function AutoSave() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['auto-save'],
    queryFn: () => autoSaveService.list(),
  })

  const schedules = data?.schedules ?? []

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      autoSaveService.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-save'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => autoSaveService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-save'] })
    },
  })

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
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
            Could not load your schedules. Please try again.
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
          Auto Save Assistant
        </h1>
        <button
          type="button"
          onClick={() => navigate('/auto-save/new')}
          className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          icon={<Zap className="size-12" />}
          title="No auto-save schedules"
          description="Set one up to save automatically!"
          actionLabel="Create Schedule"
          onAction={() => navigate('/auto-save/new')}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {schedules.map((schedule: AutoSaveSchedule) => {
            const freq = frequencyConfig[schedule.frequency] ?? frequencyConfig.custom

            return (
              <motion.div key={schedule.id} variants={staggerItem}>
                <Card variant="elevated" padding="md">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(schedule.amount)}
                      </p>
                      <Badge variant={freq.variant} size="sm">
                        {freq.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={schedule.active}
                          onChange={() =>
                            toggleMutation.mutate({
                              id: schedule.id,
                              active: !schedule.active,
                            })
                          }
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-300 dark:bg-gray-600 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this schedule?')) {
                            deleteMutation.mutate(schedule.id)
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {schedule.next_trigger && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        Next: {formatDate(schedule.next_trigger)}
                      </span>
                    )}
                    {schedule.last_triggered && (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="size-3.5" />
                        Last: {formatDate(schedule.last_triggered)}
                      </span>
                    )}
                    {schedule.note && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {schedule.note}
                      </p>
                    )}
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
