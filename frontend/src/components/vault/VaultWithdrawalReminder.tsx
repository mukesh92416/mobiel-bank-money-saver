import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/format'
import { slideUp } from '@/animations'

interface VaultWithdrawalReminderProps {
  open: boolean
  amount: number
  onConfirmed: () => void
  onCancelled: () => void
  isProcessing?: boolean
}

export function VaultWithdrawalReminder({
  open,
  amount,
  onConfirmed,
  onCancelled,
  isProcessing = false,
}: VaultWithdrawalReminderProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  const handleConfirm = () => {
    if (!acknowledged) return
    onConfirmed()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: 60, transition: { duration: 0.2 } }}
            className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4"
              >
                <Banknote className="size-7 text-amber-500" />
              </motion.div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Transfer Money from Your Bank
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Before confirming this withdrawal, please transfer <strong>{formatCurrency(amount)}</strong> from your savings account back to your bank account.
              </p>

              <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 flex items-center justify-center gap-1.5">
                <AlertTriangle className="size-4" />
                Money never leaves your bank — this is just a vault record.
              </p>

              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(amount)}
              </div>
            </div>

            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 size-4 rounded border-gray-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                I confirm that I have transferred {formatCurrency(amount)} from my savings account back to my bank account.
              </span>
            </label>

            <div className="flex flex-col gap-3">
              <Button
                variant="danger"
                size="lg"
                fullWidth
                disabled={!acknowledged}
                loading={isProcessing}
                onClick={handleConfirm}
                leftIcon={<CheckCircle className="size-5" />}
              >
                Confirm Withdrawal
              </Button>

              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={onCancelled}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
