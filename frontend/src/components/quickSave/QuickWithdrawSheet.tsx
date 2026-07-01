import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowDownFromLine,
  RotateCcw,
  Settings,
  X,
  Wallet,
  Loader2,
  Smartphone,
} from 'lucide-react'
import { upiService } from '@/services/upiService'
import { useQuickSaveStore } from '@/store/quickSaveStore'
import { UPIQrCode } from '@/components/upi/UPIQrCode'
import { UPIPaymentApps } from '@/components/upi/UPIPaymentApps'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import { openAppDeepLink, UPI_APP_PACKAGES } from '@/utils/upi'
import type { UpiGenerateResponse } from '@/types'

interface QuickWithdrawSheetProps {
  open: boolean
  onClose: () => void
}

export function QuickWithdrawSheet({ open, onClose }: QuickWithdrawSheetProps) {
  const navigate = useNavigate()
  const withdrawPresets = useQuickSaveStore((s) => s.withdrawPresets)
  const lastWithdraw = useQuickSaveStore((s) => s.lastWithdraw)
  const addWithdrawSession = useQuickSaveStore((s) => s.addWithdrawSession)
  const setWithdrawAppLaunchTime = useQuickSaveStore((s) => s.setWithdrawAppLaunchTime)

  const [step, setStep] = useState<'presets' | 'upi' | 'custom'>('presets')
  const [customAmount, setCustomAmount] = useState('')
  const [upiData, setUpiData] = useState<UpiGenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [appLaunched, setAppLaunched] = useState(false)

  const { data: upiSettings } = useQuery({
    queryKey: ['upi-settings'],
    queryFn: () => upiService.getSettings(),
    enabled: open,
  })

  const generateUpiMutation = useMutation({
    mutationFn: (data: { amount: number }) =>
      upiService.generate({ ...data, profile: 'withdrawal' }),
    onSuccess: (data) => {
      setUpiData(data)
      const id = crypto.randomUUID()
      setSessionId(id)
      addWithdrawSession({
        id,
        amount: data.amount,
        goalId: null,
        startedAt: new Date().toISOString(),
        status: 'pending',
        source: 'quick_withdraw',
      })
      openPreferredApp(data)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to generate UPI transfer.')
    },
  })

  const openPreferredApp = useCallback((data: UpiGenerateResponse) => {
    const pref = upiSettings?.withdrawal_preferred_upi_app
    if (pref && pref !== '' && UPI_APP_PACKAGES[pref] && data.upi_url) {
      openAppDeepLink(data.upi_url, UPI_APP_PACKAGES[pref]!)
    } else if (pref && pref !== '' && data.payment_apps[pref as keyof typeof data.payment_apps]) {
      openAppDeepLink(data.payment_apps[pref as keyof typeof data.payment_apps])
    } else if (data.upi_url) {
      openAppDeepLink(data.upi_url)
    }
    setWithdrawAppLaunchTime(Date.now())
    setAppLaunched(true)
    setStep('upi')
  }, [upiSettings, setWithdrawAppLaunchTime])

  function handlePresetTap(amount: number) {
    if (amount <= 0) {
      setStep('custom')
      return
    }
    setError(null)
    startQuickWithdraw(amount)
  }

  function handleCustomSubmit() {
    const amount = Number(customAmount)
    if (amount <= 0) return
    setError(null)
    startQuickWithdraw(amount)
  }

  function startQuickWithdraw(amount: number) {
    const wdUpiId = upiSettings?.withdrawal_upi_id
    if (!wdUpiId) {
      setError('Please configure your Withdrawal UPI ID in Settings first.')
      return
    }
    generateUpiMutation.mutate({ amount })
  }

  function handleWithdrawAgain() {
    if (!lastWithdraw) return
    setError(null)
    startQuickWithdraw(lastWithdraw.amount)
  }

  function handleClose() {
    if (sessionId && upiData && !appLaunched) {
      useQuickSaveStore.getState().updateWithdrawSession(sessionId, { status: 'cancelled' })
    }
    setStep('presets')
    setCustomAmount('')
    setUpiData(null)
    setError(null)
    setSessionId(null)
    setAppLaunched(false)
    onClose()
  }

  const displayPresets = withdrawPresets.filter((p) => p.id !== 'wd-custom')

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl',
              'max-h-[85vh] overflow-y-auto',
              'pb-[env(safe-area-inset-bottom,16px)]',
            )}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 pt-4 pb-2 px-5 border-b border-gray-100 dark:border-gray-800 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownFromLine className="size-5 text-red-500" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Quick Withdraw
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {step === 'presets' && (
                <>
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  {!upiSettings?.withdrawal_upi_id ? (
                    <Card variant="glass" padding="md" className="text-center">
                      <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                        No Withdrawal UPI ID configured
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { handleClose(); navigate('/settings') }}
                      >
                        Go to Settings
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {displayPresets.map((preset) => (
                        <motion.button
                          key={preset.id}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => handlePresetTap(preset.amount)}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 rounded-xl py-5 px-2 font-semibold transition-all',
                            'bg-gradient-to-br from-red-500 to-red-700 text-white',
                            'shadow-md shadow-red-500/25 hover:shadow-red-500/40',
                          )}
                        >
                          <span className="text-lg">{preset.label}</span>
                          <span className="text-[10px] opacity-80 font-normal">Withdraw</span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Custom Amount
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg font-bold py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                        />
                      </div>
                      <Button
                        variant="danger"
                        size="md"
                        onClick={handleCustomSubmit}
                        disabled={!customAmount || Number(customAmount) <= 0}
                      >
                        Withdraw
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {lastWithdraw && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleWithdrawAgain}
                        className={cn(
                          'flex items-center gap-3 w-full rounded-xl px-4 py-3.5',
                          'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
                          'border border-red-200 dark:border-red-800',
                          'hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30',
                          'transition-all',
                        )}
                      >
                        <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
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
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(lastWithdraw.amount)}
                        </span>
                      </motion.button>
                    )}

                    <button
                      onClick={() => { handleClose(); navigate('/withdraw') }}
                      className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Wallet className="size-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Full Withdraw Form
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          With goal, date
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => { handleClose(); navigate('/settings') }}
                      className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Settings className="size-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Quick Withdraw Settings
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Configure presets, behavior, amounts
                        </p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {step === 'custom' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-semibold text-gray-500 dark:text-gray-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-3xl font-bold text-center py-4 tracking-tight focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setStep('presets')}
                    >
                      Back
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={handleCustomSubmit}
                      loading={generateUpiMutation.isPending}
                      disabled={!customAmount || Number(customAmount) <= 0}
                    >
                      Withdraw ₹{Number(customAmount).toLocaleString('en-IN') || '0'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'upi' && upiData && (
                <div className="space-y-4">
                  {appLaunched && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                      <Loader2 className="size-4 animate-spin shrink-0" />
                      <span>Complete the transfer in your UPI app, then come back.</span>
                    </div>
                  )}
                  <UPIQrCode
                    qrContent={upiData.qr_content}
                    profile={{ upi_id: upiData.upi_id, upi_name: upiData.upi_name }}
                    amount={upiData.amount}
                  />
                  <UPIPaymentApps
                    paymentApps={upiData.payment_apps}
                    upiUrl={upiData.upi_url}
                    upiId={upiData.upi_id}
                    upiName={upiData.upi_name}
                    amount={upiData.amount}
                    onAppLaunch={() => setWithdrawAppLaunchTime(Date.now())}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}