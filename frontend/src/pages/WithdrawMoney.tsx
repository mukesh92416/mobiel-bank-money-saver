import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowDownFromLine, AlertCircle, CheckCircle2, HandCoins } from 'lucide-react'
import { transactionService } from '@/services/transactionService'
import { goalService } from '@/services/goalService'
import { analyticsService } from '@/services/analyticsService'
import { upiService } from '@/services/upiService'
import { useQuickSaveStore } from '@/store/quickSaveStore'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { UPIQrCode } from '@/components/upi/UPIQrCode'
import { UPIPaymentApps } from '@/components/upi/UPIPaymentApps'
import { AmountConfirmationDialog } from '@/components/upi/AmountConfirmationDialog'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import { pageVariants, slideUp, staggerContainer, staggerItem } from '@/animations/index'
import type { Goal, WithdrawInput, UpiGenerateResponse } from '@/types'

const celebrationColors = [
  'bg-red-500', 'bg-rose-500', 'bg-amber-500', 'bg-orange-500',
  'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-emerald-500',
]

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

function formatAmountInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('')
  return cleaned
}

const step1Schema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  goal_id: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
  transaction_date: z.string().min(1, 'Date is required'),
})

type Step1Form = z.infer<typeof step1Schema>

export default function WithdrawMoney() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const preselectedGoalId = searchParams.get('goal_id')

  const updateWithdrawSession = useQuickSaveStore((s) => s.updateWithdrawSession)
  const setWithdrawAppLaunchTime = useQuickSaveStore((s) => s.setWithdrawAppLaunchTime)
  const setPendingWithdraw = useQuickSaveStore((s) => s.setPendingWithdraw)

  const [step, setStep] = useState<'form' | 'upi' | 'confirm'>('form')
  const [upiData, setUpiData] = useState<UpiGenerateResponse | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAmountDialog, setShowAmountDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedData, setSubmittedData] = useState<Step1Form | null>(null)

  const { data: summaryData } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsService.summary(),
  })

  const { data: goalsData } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.list(),
  })

  const { data: upiSettings } = useQuery({
    queryKey: ['upi-settings'],
    queryFn: () => upiService.getSettings(),
  })

  const balance = summaryData?.balance ?? 0
  const goals = goalsData?.goals ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema as any),
    defaultValues: {
      amount: undefined as unknown as number,
      goal_id: preselectedGoalId ? Number(preselectedGoalId) : null,
      notes: '',
      transaction_date: new Date().toISOString().split('T')[0],
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (data: WithdrawInput) => transactionService.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setShowSuccess(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to record withdrawal. Please try again.')
    },
  })

  const generateUpiMutation = useMutation({
    mutationFn: (data: { amount: number; note?: string }) =>
      upiService.generate({ ...data, profile: 'withdrawal' }),
    onSuccess: (data) => {
      setUpiData(data)
      setStep('upi')
      setPendingWithdraw({
        amount: data.amount,
      })
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to generate UPI transfer.')
    },
  })

  const watchAmount = watch('amount')

  function handleQuickAmount(percent: number) {
    const amount = Math.floor((balance * percent) / 100)
    setValue('amount', amount, { shouldValidate: true })
  }

  function onSubmit(data: Step1Form) {
    setError(null)
    if (data.amount > balance) {
      setError(`Amount cannot exceed ${formatCurrency(balance)}`)
      return
    }
    setSubmittedData(data)

    const wdUpiId = upiSettings?.withdrawal_upi_id
    if (!wdUpiId) {
      setError('Please configure your Withdrawal UPI ID in Settings first.')
      return
    }

    generateUpiMutation.mutate({
      amount: data.amount,
    })
  }

  function handleWithdrawConfirmed(actualAmount: number) {
    if (!submittedData) return
    setError(null)
    setShowAmountDialog(false)
    setStep('confirm')
    const pendingSession = useQuickSaveStore.getState().withdrawSessions.find((s) => s.status === 'pending')
    if (pendingSession) updateWithdrawSession(pendingSession.id, { status: 'confirmed' })
    withdrawMutation.mutate({
      amount: actualAmount,
      goal_id: submittedData.goal_id || null,
      transaction_date: submittedData.transaction_date,
      notes: submittedData.notes || undefined,
    })
  }

  function handleWithdrawCancelled() {
    setUpiData(null)
    setStep('form')
    setError(null)
  }

  function handleBackFromUpi() {
    setUpiData(null)
    setStep('form')
  }

  useEffect(() => {
    return () => {
      setShowSuccess(false)
    }
  }, [])

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-600 to-red-900"
      >
        <div className="relative text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="mx-auto flex size-24 items-center justify-center rounded-full bg-white/20"
          >
            <CheckCircle2 className="size-12 text-white" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center text-white font-semibold mt-6 text-2xl"
          >
            Withdrawal Successful!
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-red-200 text-lg mt-2 font-medium"
          >
            {submittedData ? formatCurrency(submittedData.amount) : ''}
          </motion.p>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                color={celebrationColors[i % celebrationColors.length]}
                delay={i * 0.03}
              />
            ))}
          </div>
        </div>
      </motion.div>
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
      <AmountConfirmationDialog
        open={showAmountDialog}
        onClose={() => setShowAmountDialog(false)}
        onConfirm={handleWithdrawConfirmed}
        title="Confirm Withdrawal"
        icon={<ArrowDownFromLine className="size-4" />}
        confirmLabel="Confirm Withdrawal"
        loading={withdrawMutation.isPending}
      />
      {step === 'form' && (
        <>
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </motion.div>

          <motion.div variants={slideUp} initial="initial" animate="animate">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Withdraw Money
            </h1>
          </motion.div>

          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Card variant="glass" padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Current Balance
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                    {formatCurrency(balance)}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <ArrowDownFromLine className="size-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={slideUp} initial="initial" animate="animate">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-rose-600 p-6 shadow-lg shadow-red-600/30">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-6 -right-6 size-32 rounded-full bg-white" />
                <div className="absolute -bottom-8 -left-8 size-40 rounded-full bg-white" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-medium tracking-wide text-red-100/80 uppercase">
                  Withdrawal amount
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {watchAmount && watchAmount > 0
                    ? formatCurrency(Number(watchAmount))
                    : 'Enter an amount'}
                </p>
                <p className="text-xs text-red-100/60 mt-2">
                  You will transfer via UPI to your withdrawal account.
                </p>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
            <motion.div variants={slideUp} initial="initial" animate="animate">
              <Card variant="glass" padding="lg" className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-semibold text-gray-500 dark:text-gray-400">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      className={cn(
                        'block w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500',
                        'text-3xl font-bold text-center py-4 tracking-tight',
                        errors.amount
                          ? 'border-red-400 dark:border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600',
                      )}
                      value={watchAmount ? formatAmountInput(String(watchAmount)) : ''}
                      onChange={(e) => {
                        const formatted = formatAmountInput(e.target.value)
                        setValue('amount', formatted ? Number(formatted) : undefined as unknown as number, { shouldValidate: true })
                      }}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">
                      {errors.amount.message}
                    </p>
                  )}
                  {watchAmount && Number(watchAmount) > balance && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      Exceeds current balance
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 flex-wrap">
                  {[10, 25, 50, 75].map((percent) => {
                    const amount = Math.floor((balance * percent) / 100)
                    return (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => handleQuickAmount(percent)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border',
                          Number(watchAmount) === amount
                            ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/25'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400',
                        )}
                      >
                        {percent}% ({formatCurrency(amount)})
                      </button>
                    )
                  })}
                </div>

                {goals.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Deduct from Goal (optional)
                    </label>
                    <select
                      className={cn(
                        'block w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                        'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500',
                        'border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-all duration-200',
                      )}
                      value={String(watch('goal_id') ?? '')}
                      onChange={(e) =>
                        setValue('goal_id', e.target.value ? Number(e.target.value) : null, { shouldValidate: true })
                      }
                    >
                      <option value="">No goal</option>
                      {goals.filter((g: Goal) => !g.completed).map((goal: Goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title} ({formatCurrency(goal.current_amount)} saved)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any additional notes..."
                    className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-none"
                    {...register('notes')}
                  />
                </div>

                <Input
                  label="Date"
                  type="date"
                  error={errors.transaction_date?.message}
                  {...register('transaction_date')}
                />
              </Card>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={slideUp} initial="initial" animate="animate">
              <Button
                type="submit"
                variant="danger"
                size="lg"
                fullWidth
                loading={generateUpiMutation.isPending}
                leftIcon={<ArrowDownFromLine className="size-4" />}
              >
                Generate UPI Transfer
              </Button>
            </motion.div>

            {!upiSettings?.withdrawal_upi_id && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-amber-600 dark:text-amber-400 text-center"
              >
                No Withdrawal UPI ID configured. Go to Settings to set one up.
              </motion.p>
            )}
          </form>
        </>
      )}

      {step === 'upi' && upiData && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-5"
        >
          <motion.div variants={staggerItem}>
            <button
              type="button"
              onClick={handleBackFromUpi}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Edit Details
            </button>
          </motion.div>

          <motion.div variants={staggerItem}>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Complete Your Transfer
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Scan the QR or use your preferred UPI app to transfer.
            </p>
          </motion.div>

          <motion.div variants={staggerItem}>
            <UPIQrCode
              qrContent={upiData.qr_content}
              profile={{ upi_id: upiData.upi_id, upi_name: upiData.upi_name }}
              amount={upiData.amount}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <UPIPaymentApps
              paymentApps={upiData.payment_apps}
              upiUrl={upiData.upi_url}
              upiId={upiData.upi_id}
              upiName={upiData.upi_name}
              amount={upiData.amount}
              note={submittedData?.notes}
              onAppLaunch={() => setWithdrawAppLaunchTime(Date.now())}
            />
          </motion.div>

          <motion.div variants={staggerItem} className="space-y-3">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={() => setShowAmountDialog(true)}
              leftIcon={<CheckCircle2 className="size-4" />}
            >
              I Completed the Transfer
            </Button>
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={handleWithdrawCancelled}
            >
              Cancel
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.main>
  )
}
