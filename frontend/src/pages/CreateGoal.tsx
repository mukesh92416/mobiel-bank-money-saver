import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Lucide from 'lucide-react'
import {
  ArrowLeft,
  PiggyBank,
  Sparkles,
} from 'lucide-react'
import { goalService } from '@/services/goalService'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { pageVariants, slideUp } from '@/animations/index'

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  target_amount: z.coerce.number().positive('Target amount must be greater than 0'),
  deadline: z.string().optional().or(z.literal('')),
  priority: z.string().default('medium'),
  color_theme: z.string().default('emerald'),
  icon: z.string().default('PiggyBank'),
})

type GoalForm = z.infer<typeof goalSchema>

const colorThemes = [
  { value: 'emerald', class: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { value: 'blue', class: 'bg-blue-500', ring: 'ring-blue-500' },
  { value: 'amber', class: 'bg-amber-500', ring: 'ring-amber-500' },
  { value: 'red', class: 'bg-red-500', ring: 'ring-red-500' },
  { value: 'purple', class: 'bg-purple-500', ring: 'ring-purple-500' },
  { value: 'pink', class: 'bg-pink-500', ring: 'ring-pink-500' },
]

const iconOptions = [
  'PiggyBank', 'Target', 'Laptop', 'Plane', 'Bike', 'Heart', 'Home', 'Star', 'Shield', 'Zap',
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function CreateGoal() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const goalId = Number(id)

  const { data: existingGoal } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalService.get(goalId),
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema as any),
    defaultValues: {
      title: '',
      target_amount: undefined as unknown as number,
      deadline: '',
      priority: 'medium',
      color_theme: 'emerald',
      icon: 'PiggyBank',
    },
    values: isEdit && existingGoal?.goal ? {
      title: existingGoal.goal.title,
      target_amount: existingGoal.goal.target_amount,
      deadline: existingGoal.goal.deadline ?? '',
      priority: existingGoal.goal.priority || 'medium',
      color_theme: existingGoal.goal.color_theme || 'emerald',
      icon: existingGoal.goal.icon || 'PiggyBank',
    } : undefined,
  })

  const selectedTheme = watch('color_theme')
  const selectedIcon = watch('icon')

  const createMutation = useMutation({
    mutationFn: (data: GoalForm) => {
      const payload = {
        ...data,
        deadline: data.deadline || null,
      }
      return isEdit
        ? goalService.update(goalId, payload)
        : goalService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      navigate('/goals')
    },
  })

  async function onSubmit(data: GoalForm) {
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
          onClick={() => navigate('/goals')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Goals
        </button>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Goal' : 'Create New Goal'}
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
        <motion.div variants={slideUp} initial="initial" animate="animate">
          <Card variant="glass" padding="lg" className="space-y-5">
            <Input
              label="Title"
              placeholder="e.g. New Laptop"
              error={errors.title?.message}
              {...register('title')}
            />

            <Input
              label="Target Amount"
              type="number"
              placeholder="e.g. 50000"
              min={1}
              step="any"
              error={errors.target_amount?.message}
              {...register('target_amount')}
            />

            <Input
              label="Deadline"
              type="date"
              error={errors.deadline?.message}
              {...register('deadline')}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                className={cn(
                  'block w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
                  'border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-all duration-200',
                )}
                {...register('priority')}
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color Theme
              </label>
              <div className="flex gap-2.5">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setValue('color_theme', theme.value, { shouldValidate: true })}
                    className={cn(
                      'size-9 rounded-full transition-all duration-200',
                      theme.class,
                      selectedTheme === theme.value
                        ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 scale-110'
                        : 'ring-1 ring-transparent hover:scale-105 opacity-60 hover:opacity-100',
                      selectedTheme === theme.value && theme.ring,
                    )}
                    aria-label={theme.value}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((iconName) => {
                  const IconComponent = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setValue('icon', iconName, { shouldValidate: true })}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200',
                        selectedIcon === iconName
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-300',
                      )}
                    >
                      {IconComponent ? (
                        <IconComponent className="size-5" />
                      ) : (
                        <PiggyBank className="size-5" />
                      )}
                      <span className="text-[10px] font-medium leading-tight text-center">
                        {iconName}
                      </span>
                    </button>
                  )
                })}
              </div>
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
            leftIcon={<Sparkles className="size-4" />}
          >
            {isEdit ? 'Save Changes' : 'Create Goal'}
          </Button>
        </motion.div>
      </form>
    </motion.main>
  )
}
