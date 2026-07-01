import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import { slideUp, successAnimation } from '@/animations'

interface UPIConfirmationProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  onLater?: () => void
  amount: number
  isProcessing?: boolean
  className?: string
}

export function UPIConfirmation({
  open,
  onConfirm,
  onCancel,
  onLater,
  amount,
  isProcessing = false,
  className,
}: UPIConfirmationProps) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    setTimeout(() => {
      setConfirmed(false)
      onConfirm()
    }, 1200)
  }

  const handleLater = () => {
    if (onLater) {
      onLater()
    } else {
      onCancel()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4',
            'bg-black/50 backdrop-blur-sm',
            className,
          )}
        >
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: 60, transition: { duration: 0.2 } }}
            className={cn(
              'relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl',
              'bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700',
              'p-6 sm:p-8',
            )}
          >
            {confirmed ? (
              <motion.div
                variants={successAnimation}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center py-8"
              >
                <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
                  <CheckCircle className="size-8 text-emerald-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Payment Successful!
                </p>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4"
                  >
                    <Clock className="size-7 text-amber-500" />
                  </motion.div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Did you successfully complete this payment?
                  </h3>

                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(amount)}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isProcessing}
                    onClick={handleConfirm}
                  >
                    <CheckCircle className="size-5" />
                    Yes, Payment Done
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onClick={onCancel}
                    disabled={isProcessing}
                  >
                    <XCircle className="size-5" />
                    No, Cancel
                  </Button>

                  <button
                    onClick={handleLater}
                    disabled={isProcessing}
                    className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
                  >
                    I'll do it later
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
