import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Smartphone,
  Phone,
  CreditCard,
  Shield,
} from 'lucide-react'
import { transactionService } from '@/services/transactionService'
import { useQuickSaveStore } from '@/store/quickSaveStore'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import type { WithdrawInput } from '@/types'

type HandlerStep = 'idle' | 'checking' | 'confirm' | 'success' | 'error'
type SessionType = 'deposit' | 'withdrawal'

const APP_ICONS: Record<string, React.ReactNode> = {
  google_pay: <Smartphone className="size-5" />,
  phone_pe: <Phone className="size-5" />,
  paytm: <CreditCard className="size-5" />,
  bhim: <Shield className="size-5" />,
}

const APP_LABELS: Record<string, string> = {
  google_pay: 'Google Pay',
  phone_pe: 'PhonePe',
  paytm: 'Paytm',
  bhim: 'BHIM',
}

function formatTime(dateString: string) {
  try {
    const d = new Date(dateString)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function PaymentReturnHandler() {
  const queryClient = useQueryClient()

  const sessions = useQuickSaveStore((s) => s.sessions)
  const appLaunchTime = useQuickSaveStore((s) => s.appLaunchTime)
  const pendingDeposit = useQuickSaveStore((s) => s.pendingDeposit)
  const confirmedSessionIds = useQuickSaveStore((s) => s.confirmedSessionIds)
  const updateSession = useQuickSaveStore((s) => s.updateSession)
  const setAppLaunchTime = useQuickSaveStore((s) => s.setAppLaunchTime)
  const setPendingDeposit = useQuickSaveStore((s) => s.setPendingDeposit)
  const addConfirmedSession = useQuickSaveStore((s) => s.addConfirmedSession)
  const setLastSave = useQuickSaveStore((s) => s.setLastSave)
  const config = useQuickSaveStore((s) => s.config)

  const withdrawSessions = useQuickSaveStore((s) => s.withdrawSessions)
  const withdrawAppLaunchTime = useQuickSaveStore((s) => s.withdrawAppLaunchTime)
  const pendingWithdraw = useQuickSaveStore((s) => s.pendingWithdraw)
  const confirmedWithdrawSessionIds = useQuickSaveStore((s) => s.confirmedWithdrawSessionIds)
  const updateWithdrawSession = useQuickSaveStore((s) => s.updateWithdrawSession)
  const setWithdrawAppLaunchTime = useQuickSaveStore((s) => s.setWithdrawAppLaunchTime)
  const setPendingWithdraw = useQuickSaveStore((s) => s.setPendingWithdraw)
  const addConfirmedWithdrawSession = useQuickSaveStore((s) => s.addConfirmedWithdrawSession)
  const setLastWithdraw = useQuickSaveStore((s) => s.setLastWithdraw)
  const withdrawConfig = useQuickSaveStore((s) => s.withdrawConfig)

  const [step, setStep] = useState<HandlerStep>('idle')
  const [sessionType, setSessionType] = useState<SessionType>('deposit')
  const [targetSession, setTargetSession] = useState<{ id: string; amount: number; paymentApp: string | null; startedAt: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resumeDialog, setResumeDialog] = useState(false)
  const lastHiddenRef = useRef<number | null>(null)
  const checkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pendingSession = sessions.find((s) => s.status === 'pending')
  const pendingWithdrawSession = withdrawSessions.find((s) => s.status === 'pending')

  const depositMutation = useMutation({
    mutationFn: (data: { amount: number; goalId?: number | null; transactionDate?: string; notes?: string }) =>
      transactionService.deposit({
        amount: data.amount,
        goal_id: data.goalId ?? null,
        transaction_date: data.transactionDate,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setStep('success')
      setTimeout(() => {
        setStep('idle')
        setTargetSession(null)
        setAppLaunchTime(null)
        setPendingDeposit(null)
      }, 2500)
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to record deposit.')
      setStep('error')
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (data: WithdrawInput) => transactionService.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setStep('success')
      setTimeout(() => {
        setStep('idle')
        setTargetSession(null)
        setWithdrawAppLaunchTime(null)
        setPendingWithdraw(null)
      }, 2500)
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to record withdrawal.')
      setStep('error')
    },
  })

  const executeConfirm = useCallback(() => {
    if (!targetSession) return

    if (sessionType === 'deposit') {
      if (confirmedSessionIds.includes(targetSession.id)) return
      addConfirmedSession(targetSession.id)
      updateSession(targetSession.id, { status: 'confirmed' })
      if (config.rememberLastAmount) {
        setLastSave({
          amount: targetSession.amount,
          goalId: null,
          note: null,
          paymentApp: targetSession.paymentApp,
          timestamp: new Date().toISOString(),
        })
      }
      depositMutation.mutate({
        amount: targetSession.amount,
        goalId: pendingDeposit?.goalId,
        transactionDate: pendingDeposit?.transactionDate,
        notes: pendingDeposit?.notes,
      })
    } else {
      if (confirmedWithdrawSessionIds.includes(targetSession.id)) return
      addConfirmedWithdrawSession(targetSession.id)
      updateWithdrawSession(targetSession.id, { status: 'confirmed' })
      if (withdrawConfig.rememberLastAmount) {
        setLastWithdraw({
          amount: targetSession.amount,
          goalId: null,
          timestamp: new Date().toISOString(),
        })
      }
      withdrawMutation.mutate({
        amount: targetSession.amount,
        transaction_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [targetSession, sessionType, confirmedSessionIds, addConfirmedSession, updateSession, config.rememberLastAmount, setLastSave, depositMutation, confirmedWithdrawSessionIds, addConfirmedWithdrawSession, updateWithdrawSession, withdrawConfig.rememberLastAmount, setLastWithdraw, withdrawMutation, pendingDeposit, pendingWithdraw])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        lastHiddenRef.current = Date.now()
      } else if (document.visibilityState === 'visible' && lastHiddenRef.current) {
        const elapsed = Date.now() - lastHiddenRef.current
        const state = useQuickSaveStore.getState()

        if (elapsed > 2000) {
          if (state.appLaunchTime) {
            const activeSession = state.sessions.find((s) => s.status === 'pending')
            if (activeSession && !state.confirmedSessionIds.includes(activeSession.id)) {
              setSessionType('deposit')
              setTargetSession({
                id: activeSession.id,
                amount: activeSession.amount,
                paymentApp: activeSession.paymentApp,
                startedAt: activeSession.startedAt,
              })
              setStep('checking')
              setAppLaunchTime(null)
              checkingTimerRef.current = setTimeout(() => setStep('confirm'), 2000)
              lastHiddenRef.current = null
              return
            }
          }

          if (state.withdrawAppLaunchTime) {
            const activeSession = state.withdrawSessions.find((s) => s.status === 'pending')
            if (activeSession && !state.confirmedWithdrawSessionIds.includes(activeSession.id)) {
              setSessionType('withdrawal')
              setTargetSession({
                id: activeSession.id,
                amount: activeSession.amount,
                paymentApp: null,
                startedAt: activeSession.startedAt,
              })
              setStep('checking')
              setWithdrawAppLaunchTime(null)
              checkingTimerRef.current = setTimeout(() => setStep('confirm'), 2000)
              lastHiddenRef.current = null
              return
            }
          }
        }
        lastHiddenRef.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (checkingTimerRef.current) clearTimeout(checkingTimerRef.current)
    }
  }, [appLaunchTime, withdrawAppLaunchTime, confirmedSessionIds, confirmedWithdrawSessionIds, setAppLaunchTime, setWithdrawAppLaunchTime])

  useEffect(() => {
    const launchTime = appLaunchTime || withdrawAppLaunchTime
    if (!launchTime) return
    const checkResume = () => {
      if (!document.hidden) {
        const elapsed = Date.now() - launchTime
        if (elapsed > 60000) {
          if (appLaunchTime) {
            const activeSession = useQuickSaveStore.getState().sessions.find((s) => s.status === 'pending')
            if (activeSession && !confirmedSessionIds.includes(activeSession.id)) {
              setResumeDialog(true)
            }
          }
          if (withdrawAppLaunchTime) {
            const activeSession = useQuickSaveStore.getState().withdrawSessions.find((s) => s.status === 'pending')
            if (activeSession && !confirmedWithdrawSessionIds.includes(activeSession.id)) {
              setResumeDialog(true)
            }
          }
        }
      }
    }
    const timer = setTimeout(checkResume, 3000)
    return () => clearTimeout(timer)
  }, [appLaunchTime, withdrawAppLaunchTime, confirmedSessionIds, confirmedWithdrawSessionIds, pendingSession, pendingWithdrawSession, updateSession, updateWithdrawSession, setAppLaunchTime, setWithdrawAppLaunchTime])

  function handleResumeDiscard() {
    if (appLaunchTime && pendingSession) {
      updateSession(pendingSession.id, { status: 'cancelled' })
      setAppLaunchTime(null)
    }
    if (withdrawAppLaunchTime && pendingWithdrawSession) {
      updateWithdrawSession(pendingWithdrawSession.id, { status: 'cancelled' })
      setWithdrawAppLaunchTime(null)
    }
    setResumeDialog(false)
  }

  function handleResumeContinue() {
    setResumeDialog(false)
    if (pendingSession && appLaunchTime) {
      setSessionType('deposit')
      setTargetSession({
        id: pendingSession.id,
        amount: pendingSession.amount,
        paymentApp: pendingSession.paymentApp,
        startedAt: pendingSession.startedAt,
      })
      setStep('checking')
      setAppLaunchTime(null)
      checkingTimerRef.current = setTimeout(() => setStep('confirm'), 2000)
    }
    if (pendingWithdrawSession && withdrawAppLaunchTime) {
      setSessionType('withdrawal')
      setTargetSession({
        id: pendingWithdrawSession.id,
        amount: pendingWithdrawSession.amount,
        paymentApp: null,
        startedAt: pendingWithdrawSession.startedAt,
      })
      setStep('checking')
      setWithdrawAppLaunchTime(null)
      checkingTimerRef.current = setTimeout(() => setStep('confirm'), 2000)
    }
  }

  function handleCancel() {
    if (sessionType === 'deposit') {
      if (targetSession) updateSession(targetSession.id, { status: 'cancelled' })
      setAppLaunchTime(null)
      setPendingDeposit(null)
    } else {
      if (targetSession) updateWithdrawSession(targetSession.id, { status: 'cancelled' })
      setWithdrawAppLaunchTime(null)
      setPendingWithdraw(null)
    }
    if (checkingTimerRef.current) clearTimeout(checkingTimerRef.current)
    setStep('idle')
    setTargetSession(null)
    setErrorMessage(null)
  }

  const isDeposit = sessionType === 'deposit'

  return (
    <>
      <AnimatePresence>
        {step === 'checking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col items-center gap-5"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="size-12 text-emerald-400" />
              </motion.div>
              <p className="text-lg font-semibold text-white">
                {isDeposit ? 'Checking payment...' : 'Checking transfer...'}
              </p>
              <p className="text-sm text-white/60">
                {isDeposit ? 'Please wait while we verify your transaction' : 'Please wait while we check your transfer'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'confirm' && targetSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4"
                >
                  <Clock className="size-7 text-amber-500" />
                </motion.div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {isDeposit ? 'Did you successfully complete your payment?' : 'Did you successfully complete the transfer?'}
                </h3>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(targetSession.amount)}
                  </span>
                </div>
                {isDeposit && targetSession.paymentApp && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Payment App</span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {APP_ICONS[targetSession.paymentApp] || <Smartphone className="size-4" />}
                      {APP_LABELS[targetSession.paymentApp] || targetSession.paymentApp}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Started</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatTime(targetSession.startedAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isDeposit ? depositMutation.isPending : withdrawMutation.isPending}
                  onClick={executeConfirm}
                >
                  <CheckCircle className="size-5" />
                  {isDeposit ? 'Yes, Payment Completed' : 'Yes, Transfer Completed'}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={handleCancel}
                  disabled={isDeposit ? depositMutation.isPending : withdrawMutation.isPending}
                >
                  <XCircle className="size-5" />
                  {isDeposit ? 'No, I Cancelled' : 'No, I Cancelled'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-900"
          >
            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                className="mx-auto flex size-24 items-center justify-center rounded-full bg-white/20"
              >
                <CheckCircle className="size-12 text-white" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center text-white font-semibold mt-6 text-2xl"
              >
                {isDeposit ? 'Payment Successful!' : 'Withdrawal Successful!'}
              </motion.p>
              {targetSession && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-emerald-200 text-lg mt-2 font-medium"
                >
                  {formatCurrency(targetSession.amount)}
                </motion.p>
              )}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                    animate={{
                      opacity: [1, 0.8, 0],
                      y: [0, -150 - Math.random() * 150],
                      x: [0, (Math.random() - 0.5) * 250],
                      scale: [1, 1.5, 0],
                      rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                    }}
                    transition={{ duration: 1.5 + Math.random(), delay: i * 0.03, ease: 'easeOut' }}
                    className={cn(
                      'absolute size-2.5 rounded-full',
                      ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-rose-500'][i % 8],
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl text-center"
            >
              <div className="size-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
                <XCircle className="size-7 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {errorMessage || (isDeposit ? 'Failed to record your deposit.' : 'Failed to record your withdrawal.')}
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={handleCancel}>
                  Dismiss
                </Button>
                <Button variant="primary" fullWidth onClick={executeConfirm}>
                  Try Again
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resumeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl text-center"
            >
              <div className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4">
                <Clock className="size-7 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Unfinished Transaction
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                You have an unfinished transaction attempt. Would you like to continue or discard it?
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={handleResumeDiscard}>
                  Discard
                </Button>
                <Button variant="primary" fullWidth onClick={handleResumeContinue}>
                  Resume
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}