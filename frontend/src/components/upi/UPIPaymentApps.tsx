import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  Phone,
  CreditCard,
  Shield,
  MessageCircle,
  Copy,
  Link,
  Check,
  QrCode,
  Star,
  ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PaymentQRDialog } from '@/components/upi/PaymentQRDialog'
import { cn } from '@/utils/cn'
import { staggerContainer, staggerItem } from '@/animations'
import { copyToClipboard, openAppDeepLink, UPI_APP_PACKAGES } from '@/utils/upi'

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
  upiName?: string | null
  amount?: number
  note?: string | null
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

const bottomSheetVariants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
}

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export function UPIPaymentApps({
  paymentApps,
  upiId,
  upiUrl,
  upiName,
  amount,
  note,
  className,
  onAppLaunch,
}: UPIPaymentAppsProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const apps = Object.entries(paymentApps) as [keyof PaymentApps, string][]

  const handleOpenApp = async (appKey: keyof PaymentApps) => {
    onAppLaunch?.(appKey)
    setSheetOpen(false)
    const url = upiUrl || paymentApps[appKey]
    const packageName = UPI_APP_PACKAGES[appKey] ?? undefined
    console.log('[UPI Debug] Selected app:', appKey)
    console.log('[UPI Debug] Package:', packageName ?? '(none)')
    console.log('[UPI Debug] URI:', url)
    await openAppDeepLink(url, packageName)
  }

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setter(true)
      setTimeout(() => setter(false), 2000)
    }
  }

  const handleShowQr = () => {
    setSheetOpen(false)
    setQrDialogOpen(true)
  }

  return (
    <>
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

          <motion.button
            variants={staggerItem}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSheetOpen(true)}
            className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Smartphone className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Choose Payment Method</p>
                <p className="text-xs text-emerald-100/80">UPI apps, QR code, or copy details</p>
              </div>
            </div>
            <ChevronDown className="size-5 opacity-70" />
          </motion.button>
        </Card>
      </motion.div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />

            <motion.div
              className="relative w-full max-w-lg mx-auto rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 border-b-0 max-h-[85vh] overflow-y-auto"
              variants={bottomSheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 pt-3 pb-2 px-5 border-b border-gray-100 dark:border-gray-700/50 z-10">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pay with
                </h3>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {apps.filter(([key]) => key !== 'whatsapp').map(([key]) => {
                    const meta = appMeta[key]
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleOpenApp(key)}
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
                      or
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShowQr}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">
                    <Star className="size-2.5 fill-current" />
                    Recommended
                  </div>
                  <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <QrCode className="size-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Show Payment QR</p>
                    <p className="text-xs text-emerald-100/80">Scan with any UPI app</p>
                  </div>
                </motion.button>

                <div className="flex flex-col gap-2">
                  {upiId && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCopy(upiId, setCopiedId)}
                      className={cn(
                        'flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all border',
                        copiedId
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      )}
                    >
                      {copiedId ? (
                        <><Check className="size-4" /> UPI ID Copied!</>
                      ) : (
                        <><Copy className="size-4" /> Copy UPI ID</>
                      )}
                    </motion.button>
                  )}
                  {upiUrl && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCopy(upiUrl, setCopiedLink)}
                      className={cn(
                        'flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all border',
                        copiedLink
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      )}
                    >
                      {copiedLink ? (
                        <><Check className="size-4" /> Payment Link Copied!</>
                      ) : (
                        <><Link className="size-4" /> Copy Payment Link</>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {upiUrl && upiId && (
        <PaymentQRDialog
          open={qrDialogOpen}
          onClose={() => setQrDialogOpen(false)}
          upiUri={upiUrl}
          upiId={upiId}
          upiName={upiName}
          amount={amount}
          note={note}
        />
      )}
    </>
  )
}
