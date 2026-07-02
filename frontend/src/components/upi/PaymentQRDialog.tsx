import { useCallback, useState } from 'react'
import QRCodeUtil from 'qrcode'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Copy, Check, Link } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/utils/format'
import { copyToClipboard, downloadQRCode } from '@/utils/upi'
import { cn } from '@/utils/cn'

interface PaymentQRDialogProps {
  open: boolean
  onClose: () => void
  upiUri: string
  upiId: string
  upiName?: string | null
  amount?: number
  note?: string | null
}

export function PaymentQRDialog({
  open,
  onClose,
  upiUri,
  upiId,
  upiName,
  amount,
  note,
}: PaymentQRDialogProps) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyId = useCallback(async () => {
    const ok = await copyToClipboard(upiId)
    if (ok) {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }, [upiId])

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(upiUri)
    if (ok) {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }, [upiUri])

  const handleDownload = useCallback(async () => {
    console.log('[PaymentQRDialog] handleDownload triggered')
    try {
      const dataUrl = await QRCodeUtil.toDataURL(upiUri, {
        width: 600,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' },
      })
      console.log('[PaymentQRDialog] QR generated as data URL')
      await downloadQRCode(dataUrl)
    } catch (err) {
      console.error('[PaymentQRDialog] download failed:', err)
    }
  }, [upiUri])

  return (
    <Modal open={open} onClose={onClose} title="Scan to Pay" className="max-w-sm">
      <div className="flex flex-col items-center gap-5">
        <div className="relative p-3 rounded-2xl bg-white shadow-lg ring-2 ring-emerald-500/20">
          <QRCodeSVG
            id="payment-qr-svg"
            value={upiUri}
            size={280}
            level="M"
            fgColor="#111827"
            bgColor="#ffffff"
            includeMargin
          />
        </div>

        <div className="w-full text-center space-y-1">
          {amount !== undefined && (
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(amount)}
            </p>
          )}
          {upiName && (
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {upiName}
            </p>
          )}
          <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
            {upiId}
          </p>
          {note && (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              {note}
            </p>
          )}
        </div>

        <div className="w-full flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all border',
                copiedId
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-white dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/60 border-gray-200 dark:border-gray-600',
              )}
            >
              {copiedId ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> UPI ID</>}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all border',
                copiedLink
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-white dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/60 border-gray-200 dark:border-gray-600',
              )}
            >
              {copiedLink ? <><Check className="size-4" /> Copied</> : <><Link className="size-4" /> Link</>}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
          >
            <Download className="size-4" />
            Download QR
          </button>
        </div>
      </div>
    </Modal>
  )
}
