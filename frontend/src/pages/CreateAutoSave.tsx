import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Zap } from 'lucide-react'
import { autoSaveService } from '@/services/autoSaveService'
import { goalService } from '@/services/goalService'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { pageVariants, slideUp } from '@/animations/index'

const autoSaveSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'salary', 'custom']),
  day_of_week: z.coerce.number().min(0).max(6).optional().nullable(),
  day_of_month: z.coerce.number().min(1).max(31).optional().nullable(),
  time: z.string().optional(),
  note: z.string().optional(),
  goal_id: z.coerce.number().optional().nullable(),
})

type AutoSaveForm = z.infer<typeof autoSaveSchema>

const weekDays = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
]

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'salary', label: 'Salary Day' },
  { value: 'custom', label: 'Custom' },
]

export default function CreateAutoSave() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: goalsData } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.list(),
  })

  const goals = goalsData?.goals ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AutoSaveForm>({
    resolver: zodResolver(autoSaveSchema as any),
    defaultValues: {
      amount: undefined as unknown as number,
      frequency: 'daily',
      day_of_week: null,
      day_of_month: null,
      time: '',
      note: '',
      goal_id: null,
    },
  })

  const frequency = watch('frequency')

  const createMutation = useMutation({
    mutationFn: (data: AutoSaveForm) => {
      const payload = {
        amount: data.amount,
        frequency: data.frequency,
        day_of_week: data.frequency === 'weekly' ? data.day_of_week : null,
        day_of_month: data.frequency === 'monthly' || data.frequency === 'custom' ? data.day_of_month : null,
        time: data.time || null,
        note: data.note || null,
        goal_id: data.goal_id || null,
      }
      return autoSaveService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-save'] })
      navigate('/auto-save')
    },
  })

  async function onSubmit(data: AutoSaveForm) {
    createMutation.mutate(data)
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
        <button
          type="button"
          onClick={() => navigate('/auto-save')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Create Auto Save Schedule
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
        <motion.div variants={slideUp} initial="initial" animate="animate">
          <Card variant="glass" padding="lg" className="space-y-5">
            <Input
              label="Amount"
              type="number"
              placeholder="e.g. 1000"
              min={1}
              step="any"
              error={errors.amount?.message}
              {...register('amount')}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frequency
              </label>
              <select
                className={cn(
                  'block w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
                  'border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-all duration-200',
                )}
                {...register('frequency')}
              >
                {frequencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {frequency === 'weekly' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Day of Week
                </label>
                <div className="flex gap-1.5">
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setValue('day_of_week', day.value, { shouldValidate: true })}
                      className={cn(
                        'size-9 rounded-xl border text-xs font-medium transition-all duration-200',
                        watch('day_of_week') === day.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-300',
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(frequency === 'monthly' || frequency === 'custom') && (
              <Input
                label="Day of Month"
                type="number"
                placeholder="1-31"
                min={1}
                max={31}
                error={errors.day_of_month?.message}
                {...register('day_of_month')}
              />
            )}

            <Input
              label="Time (optional)"
              type="time"
              error={errors.time?.message}
              {...register('time')}
            />

            <Input
              label="Note (optional)"
              placeholder="e.g. Weekly coffee savings"
              error={errors.note?.message}
              {...register('note')}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Link to Goal (optional)
              </label>
              <select
                className={cn(
                  'block w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
                  'border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-all duration-200',
                )}
                {...register('goal_id')}
              >
                <option value="">No goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={slideUp} initial="initial" animate="animate">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting || createMutation.isPending}
            leftIcon={<Zap className="size-4" />}
          >
            Create Schedule
          </Button>
        </motion.div>
      </form>
    </motion.main>
  )
}
