import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, QrCode, Check, Copy } from 'lucide-react'
import QRCode from 'qrcode'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import { staggerContainer, staggerItem, scaleIn } from '@/animations'
import { shareContent } from '@/utils/upi'

interface UPIQrCodeProps {
  qrContent: string
  amount?: number
  profile?: import('@/types').UpiQrProfile
  className?: string
}

export function UPIQrCode({ qrContent, amount, profile, className }: UPIQrCodeProps) {
  const upiId = profile?.upi_id
  const upiName = profile?.upi_name
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrSrc, setQrSrc] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)

  useEffect(() => {
    if (!qrContent) return
    setQrLoaded(false)
    QRCode.toDataURL(qrContent, {
      width: 600,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    }).then((url) => {
      setQrSrc(url)
      setQrLoaded(true)
    }).catch(() => {
      setQrLoaded(false)
    })
  }, [qrContent])

  const handleDownload = useCallback(() => {
    if (!qrSrc) return
    const link = document.createElement('a')
    link.href = qrSrc
    link.download = `upi-qr-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [qrSrc])

  const handleShare = useCallback(async () => {
    if (upiId) {
      await shareContent({
        title: 'UPI Payment',
        text: `Pay via UPI ID: ${upiId}${amount ? ` for ₹${amount}` : ''}`,
        url: qrContent,
      })
    }
  }, [upiId, amount, qrContent])

  const handleCopyId = useCallback(async () => {
    if (!upiId) return
    try {
      await navigator.clipboard.writeText(upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard write failed
    }
  }, [upiId])

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn('w-full max-w-sm mx-auto', className)}
    >
      <motion.div variants={staggerItem}>
        <Card variant="glass" padding="lg" className="text-center">
          <motion.div variants={scaleIn}>
            <Badge variant="primary" size="md" className="mb-4">
              <QrCode className="size-3.5" />
              Scan to Pay
            </Badge>
          </motion.div>

          <motion.div
            variants={scaleIn}
            className="relative mx-auto mb-4 w-56 h-56 rounded-2xl bg-white p-2 shadow-lg ring-2 ring-emerald-500/20 flex items-center justify-center"
          >
            {!qrLoaded && (
              <div className="absolute inset-2 rounded-xl skeleton" />
            )}
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="UPI QR Code"
                className={cn(
                  'w-full h-full object-contain rounded-xl transition-opacity duration-300',
                  qrLoaded ? 'opacity-100' : 'opacity-0',
                )}
              />
            ) : (
              <canvas ref={canvasRef} className="hidden" />
            )}
          </motion.div>

          {amount !== undefined && (
            <motion.p
              variants={staggerItem}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
            >
              {formatCurrency(amount)}
            </motion.p>
          )}

          {upiName && (
            <motion.p
              variants={staggerItem}
              className="text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              {upiName}
            </motion.p>
          )}

          {upiId && (
            <motion.div variants={staggerItem} className="mt-2">
              <motion.button
                onClick={handleCopyId}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  copied
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/60',
                )}
              >
                {copied ? (
                  <><Check className="size-3" /> UPI ID Copied!</>
                ) : (
                  <><Copy className="size-3" /> {upiId}</>
                )}
              </motion.button>
            </motion.div>
          )}

          <motion.div
            variants={staggerItem}
            className="flex items-center justify-center gap-3 mt-5"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
            >
              <Download className="size-4" />
              Download QR
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600/60 transition-colors"
            >
              <Share2 className="size-4" />
              Share
            </motion.button>
          </motion.div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
