import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scanner, useDevices } from '@yudiel/react-qr-scanner'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import {
  Camera,
  ClipboardPaste,
  QrCode,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { parseUpiUri, type ParsedUpiUri } from '@/utils/upi'
import { cn } from '@/utils/cn'

interface UPIImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (data: ParsedUpiUri) => void
}

type ImportTab = 'scan' | 'paste'

export function UPIImportDialog({ open, onClose, onImport }: UPIImportDialogProps) {
  const [tab, setTab] = useState<ImportTab>('scan')
  const [pasteValue, setPasteValue] = useState('')
  const [pasteResult, setPasteResult] = useState<ParsedUpiUri | null>(null)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ParsedUpiUri | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const devices = useDevices()

  const handleScan = useCallback((detectedCodes: IDetectedBarcode[]) => {
    const rawValue = detectedCodes[0]?.rawValue
    if (!rawValue) return
    try {
      const parsed = parseUpiUri(rawValue)
      setScanResult(parsed)
      setScanError(null)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Failed to parse QR code')
      setScanResult(null)
    }
  }, [])

  const handleScanError = useCallback((error: unknown) => {
    const msg = error instanceof Error ? error.message : 'Camera error'
    if (msg.includes('Permission')) {
      setScanError('Camera permission denied. Please allow camera access in your browser settings.')
    } else {
      setScanError(msg)
    }
  }, [])

  const handlePasteParse = () => {
    setPasteError(null)
    setPasteResult(null)
    try {
      const parsed = parseUpiUri(pasteValue)
      setPasteResult(parsed)
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : 'Failed to parse UPI link')
    }
  }

  const handleImport = () => {
    const data = tab === 'scan' ? scanResult : pasteResult
    if (data) {
      onImport(data)
      resetState()
    }
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  function resetState() {
    setPasteValue('')
    setPasteResult(null)
    setPasteError(null)
    setScanError(null)
    setScanResult(null)
    setTab('scan')
  }

  const tabs: { key: ImportTab; label: string; icon: typeof Camera }[] = [
    { key: 'scan', label: 'Scan QR', icon: Camera },
    { key: 'paste', label: 'Paste Link', icon: ClipboardPaste },
  ]

  const previewData = tab === 'scan' ? scanResult : pasteResult

  return (
    <Modal open={open} onClose={handleClose} title="Import UPI Information" className="max-w-md">
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setScanError(null); setScanResult(null); setPasteError(null); setPasteResult(null) }}
            className={cn(
              'flex items-center justify-center gap-1.5 flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
              tab === key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'scan' ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {scanResult ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                  <QrCode className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">QR Code Scanned Successfully</p>
              </div>
            ) : scanError ? (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{scanError}</p>
                </div>
              </div>
            ) : null}

            {!scanResult && !scanError && (
              <div className="relative overflow-hidden rounded-xl bg-black aspect-[3/4] max-h-72">
                <Scanner
                  onScan={handleScan}
                  onError={handleScanError}
                  formats={['qr_code']}
                  components={{ finder: true }}
                  styles={{ container: { width: '100%', height: '100%' } }}
                />
                <div className="absolute inset-0 border-2 border-emerald-400/50 rounded-xl pointer-events-none" />
              </div>
            )}

            {devices.length > 1 && (
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Auto Camera</option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            )}

            {!scanResult && !scanError && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1">
                <Camera className="size-3" />
                Point your camera at a UPI QR code
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Paste UPI Link
              </label>
              <textarea
                value={pasteValue}
                onChange={(e) => { setPasteValue(e.target.value); setPasteResult(null); setPasteError(null) }}
                placeholder="upi://pay?pa=example@upi&pn=John%20Doe&cu=INR"
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              />
            </div>

            {pasteValue && !pasteResult && (
              <Button variant="secondary" size="sm" onClick={handlePasteParse} fullWidth>
                <ClipboardPaste className="size-4" />
                Parse Link
              </Button>
            )}

            {pasteError && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300">{pasteError}</p>
              </div>
            )}

            {!pasteValue && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Paste a UPI payment link starting with <span className="font-mono">upi://pay</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {previewData && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4"
        >
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview</p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">UPI ID</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{previewData.pa}</span>
            </div>
            {previewData.pn && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Name</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{decodeURIComponent(previewData.pn)}</span>
              </div>
            )}
            {previewData.tn && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Note</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{decodeURIComponent(previewData.tn)}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3 mt-5">
        <Button variant="secondary" size="sm" onClick={handleClose} fullWidth>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleImport}
          disabled={!previewData}
          fullWidth
        >
          <Check className="size-4" />
          Import
        </Button>
      </div>
    </Modal>
  )
}
