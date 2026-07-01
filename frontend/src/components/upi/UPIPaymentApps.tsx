import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone,
  Phone,
  CreditCard,
  Shield,
  MessageCircle,
  Copy,
  Link,
  Check,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { staggerContainer, staggerItem } from '@/animations'
import { copyToClipboard } from '@/utils/upi'

interface PaymentApps {
  google_pay: string
  phone_pe: string
  paytm: string
  bhim: string
  whatsapp: string
}

interface UPIPaymentAppsProps {
  paymentApps: PaymentApps
  upiId?: string
  upiUrl?: string
  className?: string
  onAppLaunch?: (appKey: string) => void
}

const appMeta: Record<
  keyof PaymentApps,
  { label: string; icon: ReactNode; color: string }
> = {
  google_pay: {
    label: 'Google Pay',
    icon: <Smartphone className="size-6" />,
    color: 'from-blue-500 to-blue-600',
  },
  phone_pe: {
    label: 'PhonePe',
    icon: <Phone className="size-6" />,
    color: 'from-purple-500 to-purple-600',
  },
  paytm: {
    label: 'Paytm',
    icon: <CreditCard className="size-6" />,
    color: 'from-cyan-500 to-cyan-600',
  },
  bhim: {
    label: 'BHIM',
    icon: <Shield className="size-6" />,
    color: 'from-emerald-500 to-emerald-600',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: <MessageCircle className="size-6" />,
    color: 'from-green-500 to-green-600',
  },
}

export function UPIPaymentApps({
  paymentApps,
  upiId,
  upiUrl,
  className,
  onAppLaunch,
}: UPIPaymentAppsProps) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedDebug, setCopiedDebug] = useState(false)

  const apps = Object.entries(paymentApps) as [keyof PaymentApps, string][]

  const handleOpenApp = (url: string, appKey: string) => {
    onAppLaunch?.(appKey)
    console.log('[UPI Debug] Launching URI:', url)
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setter(true)
      setTimeout(() => setter(false), 2000)
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn('w-full', className)}
    >
      <Card variant="glass" padding="lg">
        <motion.h3
          variants={staggerItem}
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4"
        >
          Pay with
        </motion.h3>

        <div className="grid grid-cols-2 gap-3">
          {apps.map(([key, url]) => {
            const meta = appMeta[key]
            return (
              <motion.button
                key={key}
                variants={staggerItem}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOpenApp(url, key)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
                  'bg-gradient-to-br border border-white/20 dark:border-gray-700/30',
                  'text-white shadow-lg hover:shadow-xl transition-shadow',
                  meta.color,
                )}
              >
                {meta.icon}
                <span className="text-xs font-semibold">{meta.label}</span>
                <span className="text-[10px] opacity-80">Tap to open</span>
              </motion.button>
            )
          })}
        </div>

        <motion.div
          variants={staggerItem}
          className="flex flex-col gap-2 mt-5"
        >
          {upiId && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCopy(upiId, setCopiedId)}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
                'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                'hover:bg-emerald-500/10',
              )}
            >
              {copiedId ? (
                <>
                  <Check className="size-4" />
                  UPI ID Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy UPI ID
                </>
              )}
            </motion.button>
          )}
          {upiUrl && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCopy(upiUrl, setCopiedLink)}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
                'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                'hover:bg-emerald-500/10',
              )}
            >
              {copiedLink ? (
                <>
                  <Check className="size-4" />
                  Payment Link Copied!
                </>
              ) : (
                <>
                  <Link className="size-4" />
                  Copy Payment Link
                </>
              )}
            </motion.button>
          )}
          {upiUrl && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCopy(upiUrl, setCopiedDebug)}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-xs font-mono transition-all border border-dashed border-yellow-400/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
            >
              {copiedDebug ? (
                <>
                  <Check className="size-3" />
                  URI Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Debug: Copy Raw UPI URI
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </Card>
    </motion.div>
  )
}
