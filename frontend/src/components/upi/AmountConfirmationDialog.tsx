import { useState, useCallback, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, HandCoins, ArrowDownFromLine } from 'lucide-react'
import { cn } from '@/utils/cn'

interface AmountConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (amount: number) => void
  title: string
  icon: ReactNode
  confirmLabel: string
  loading?: boolean
}

export function AmountConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  icon,
  confirmLabel,
  loading,
}: AmountConfirmationDialogProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = useCallback(() => {
    const cleaned = input.replace(/,/g, '')
    const amount = Number(cleaned)
    if (!cleaned.trim()) {
      setError('Amount is required')
      return
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than zero')
      return
    }
    const parts = cleaned.split('.')
    if (parts.length > 1 && parts[1].length > 2) {
      setError('Maximum two decimal places')
      return
    }
    setError(null)
    onConfirm(amount)
  }, [input, onConfirm])

  const handleClose = useCallback(() => {
    setInput('')
    setError(null)
    onClose()
  }, [onClose])

  function handleInputChange(value: string) {
    if (error) setError(null)
    const cleaned = value.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    if (parts.length > 1 && parts[1].length > 2) return
    setInput(cleaned)
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} className="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the amount you successfully transferred.
        </p>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-semibold text-gray-400 dark:text-gray-500">
            ₹
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            autoFocus
            className={cn(
              'block w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-3xl font-bold text-center py-4 tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
              error ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500',
            )}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">
            <AlertTriangle className="size-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={handleClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            loading={loading}
            disabled={!input.trim() || Number(input.replace(/,/g, '')) <= 0}
            fullWidth
          >
            {icon}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
