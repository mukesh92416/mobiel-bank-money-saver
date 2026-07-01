import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  FileText,
  ChevronDown,
  Check,
  ExternalLink,
  Info,
  BookOpen,
  Trash2,
  Smartphone,
  Copy,
  Zap,
  Plus,
  X,
  GripVertical,
  ArrowDownFromLine,
  HandCoins,
  Bell,
  Clock,
  Globe,
  Save,
  Camera,
  ClipboardPaste,
  QrCode,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { useQuickSaveStore } from '@/store/quickSaveStore'
import { settingsService } from '@/services/settingsService'
import { authService } from '@/services/authService'
import { UPIImportDialog } from '@/components/upi/UPIImportDialog'
import { parseUpiUri, type ParsedUpiUri } from '@/utils/upi'
import { cn } from '@/utils/cn'
import { pageVariants, staggerContainer, staggerItem } from '@/animations/index'

const currencies = ['INR', 'USD', 'EUR', 'GBP']
const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'mr', name: 'Marathi' },
]

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

type ConfirmAction = 'reset' | 'delete' | null

export default function Settings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setDark } = useThemeStore()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  })

  const settings = settingsData?.settings

  const [theme, setTheme] = useState(settings?.theme ?? 'system')
  const [currency, setCurrency] = useState(settings?.currency ?? user?.currency ?? 'INR')
  const [language, setLanguage] = useState(settings?.language ?? user?.language ?? 'en')

  const [notifications, setNotifications] = useState({
    daily_reminder: settings?.daily_reminder ?? true,
    goal_reminder: settings?.goal_reminder ?? true,
    achievement_notification: settings?.achievement_notification ?? true,
    monthly_report: settings?.monthly_report ?? true,
  })

  const detectTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'UTC'
    }
  }

  const [reminder, setReminder] = useState({
    reminder_enabled: settings?.reminder_enabled ?? false,
    reminder_time: settings?.reminder_time ?? '09:00',
    reminder_frequency: settings?.reminder_frequency ?? 'daily' as const,
    reminder_days: settings?.reminder_days ?? '',
    reminder_amount: settings?.reminder_amount ?? 0,
    reminder_title: settings?.reminder_title ?? 'Money Vault Reminder',
    reminder_message: settings?.reminder_message ?? "Don't forget today's savings!",
    reminder_timezone: settings?.reminder_timezone ?? detectTimezone(),
  })

  const [reminderDays, setReminderDays] = useState<string[]>(() => {
    return reminder.reminder_days ? reminder.reminder_days.split(',').filter(Boolean) : []
  })

  const [upiForm, setUpiForm] = useState({
    upi_id: settings?.upi_id ?? '',
    upi_name: settings?.upi_name ?? '',
    preferred_upi_app: settings?.preferred_upi_app ?? '',
    default_save_amount: settings?.default_save_amount ?? 0,
    default_save_note: settings?.default_save_note ?? '',
  })

  const [withdrawalUpiForm, setWithdrawalUpiForm] = useState({
    withdrawal_upi_id: settings?.withdrawal_upi_id ?? '',
    withdrawal_upi_name: settings?.withdrawal_upi_name ?? '',
    withdrawal_preferred_upi_app: settings?.withdrawal_preferred_upi_app ?? '',
    withdrawal_default_amount: settings?.withdrawal_default_amount ?? 0,
    withdrawal_default_note: settings?.withdrawal_default_note ?? '',
  })

  const [upiCopied, setUpiCopied] = useState(false)
  const [wdUpiCopied, setWdUpiCopied] = useState(false)
  const [withdrawalUpiErrors, setWithdrawalUpiErrors] = useState<Record<string, string>>({})
  const [withdrawalSaveSuccess, setWithdrawalSaveSuccess] = useState(false)
  const [showDepositImport, setShowDepositImport] = useState(false)
  const [showWithdrawalImport, setShowWithdrawalImport] = useState(false)

  const qsPresets = useQuickSaveStore((s) => s.presets)
  const qsConfig = useQuickSaveStore((s) => s.config)
  const setPresets = useQuickSaveStore((s) => s.setPresets)
  const updateConfig = useQuickSaveStore((s) => s.updateConfig)
  const [editingPreset, setEditingPreset] = useState<string | null>(null)
  const [newPresetAmount, setNewPresetAmount] = useState('')
  const [newPresetLabel, setNewPresetLabel] = useState('')

  const wdPresets = useQuickSaveStore((s) => s.withdrawPresets)
  const wdConfig = useQuickSaveStore((s) => s.withdrawConfig)
  const setWdPresets = useQuickSaveStore((s) => s.setWithdrawPresets)
  const updateWdConfig = useQuickSaveStore((s) => s.updateWithdrawConfig)
  const [editingWdPreset, setEditingWdPreset] = useState<string | null>(null)
  const [newWdPresetAmount, setNewWdPresetAmount] = useState('')
  const [newWdPresetLabel, setNewWdPresetLabel] = useState('')

  function handleUpiChange(field: string, value: string | number) {
    setUpiForm(prev => ({ ...prev, [field]: value }))
  }

  function handleWithdrawalUpiChange(field: string, value: string | number) {
    setWithdrawalUpiForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSaveUpi() {
    updateSettingsMutation.mutate({
      upi_id: upiForm.upi_id,
      upi_name: upiForm.upi_name,
      preferred_upi_app: upiForm.preferred_upi_app,
      default_save_amount: Number(upiForm.default_save_amount),
      default_save_note: upiForm.default_save_note,
      withdrawal_upi_id: withdrawalUpiForm.withdrawal_upi_id,
      withdrawal_upi_name: withdrawalUpiForm.withdrawal_upi_name,
      withdrawal_preferred_upi_app: withdrawalUpiForm.withdrawal_preferred_upi_app,
      withdrawal_default_amount: Number(withdrawalUpiForm.withdrawal_default_amount),
      withdrawal_default_note: withdrawalUpiForm.withdrawal_default_note,
    } as Partial<NonNullable<typeof settings>>)
  }

  function validateWithdrawalUpi(): boolean {
    const errors: Record<string, string> = {}
    const id = withdrawalUpiForm.withdrawal_upi_id.trim()
    if (!id) {
      errors.withdrawal_upi_id = 'UPI ID is required'
    } else if (!/^[\w.\-]+@[\w.\-]+$/.test(id)) {
      errors.withdrawal_upi_id = 'Invalid UPI ID format (e.g., name@bank)'
    }
    if (!withdrawalUpiForm.withdrawal_upi_name.trim()) {
      errors.withdrawal_upi_name = 'Receiver Name is required'
    }
    if (withdrawalUpiForm.withdrawal_default_amount < 0) {
      errors.withdrawal_default_amount = 'Amount must be 0 or greater'
    }
    if (!withdrawalUpiForm.withdrawal_preferred_upi_app) {
      errors.withdrawal_preferred_upi_app = 'Please select a payment app'
    }
    setWithdrawalUpiErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleDepositImport(data: ParsedUpiUri) {
    setUpiForm(prev => ({
      ...prev,
      upi_id: data.pa,
      upi_name: data.pn ? decodeURIComponent(data.pn) : prev.upi_name,
      default_save_note: data.tn ? decodeURIComponent(data.tn) : prev.default_save_note,
    }))
    setShowDepositImport(false)
  }

  function handleWithdrawalImport(data: ParsedUpiUri) {
    setWithdrawalUpiForm(prev => ({
      ...prev,
      withdrawal_upi_id: data.pa,
      withdrawal_upi_name: data.pn ? decodeURIComponent(data.pn) : prev.withdrawal_upi_name,
      withdrawal_default_note: data.tn ? decodeURIComponent(data.tn) : prev.withdrawal_default_note,
    }))
    setShowWithdrawalImport(false)
  }

  function handleSaveWithdrawalUpi() {
    if (!validateWithdrawalUpi()) return
    setWithdrawalSaveSuccess(false)
    updateSettingsMutation.mutate(
      {
        withdrawal_upi_id: withdrawalUpiForm.withdrawal_upi_id,
        withdrawal_upi_name: withdrawalUpiForm.withdrawal_upi_name,
        withdrawal_preferred_upi_app: withdrawalUpiForm.withdrawal_preferred_upi_app,
        withdrawal_default_amount: Number(withdrawalUpiForm.withdrawal_default_amount),
        withdrawal_default_note: withdrawalUpiForm.withdrawal_default_note,
      } as Partial<NonNullable<typeof settings>>,
      {
        onSuccess: () => {
          setWithdrawalUpiErrors({})
          setWithdrawalSaveSuccess(true)
          setTimeout(() => setWithdrawalSaveSuccess(false), 2500)
        },
      },
    )
  }

  function handleCopyWithdrawalUpiId() {
    if (withdrawalUpiForm.withdrawal_upi_id) {
      navigator.clipboard.writeText(withdrawalUpiForm.withdrawal_upi_id)
      setWdUpiCopied(true)
      setTimeout(() => setWdUpiCopied(false), 2000)
    }
  }

  function handleCopyUpiId() {
    if (upiForm.upi_id) {
      navigator.clipboard.writeText(upiForm.upi_id)
      setUpiCopied(true)
      setTimeout(() => setUpiCopied(false), 2000)
    }
  }

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Parameters<typeof settingsService.update>[0]) =>
      settingsService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: Parameters<typeof authService.updateProfile>[0]) =>
      authService.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.user)
    },
  })

  function handleThemeChange(value: string) {
    setTheme(value)
    setOpenDropdown(null)
    if (value === 'light') setDark(false)
    else if (value === 'dark') setDark(true)
    updateSettingsMutation.mutate({ theme: value } as Partial<NonNullable<typeof settings>>)
  }

  function handleCurrencyChange(value: string) {
    setCurrency(value)
    setOpenDropdown(null)
    updateSettingsMutation.mutate({ currency: value } as Partial<NonNullable<typeof settings>>)
    updateProfileMutation.mutate({ currency: value } as Partial<NonNullable<typeof user>>)
  }

  function handleLanguageChange(value: string) {
    setLanguage(value)
    setOpenDropdown(null)
    updateSettingsMutation.mutate({ language: value } as Partial<NonNullable<typeof settings>>)
    updateProfileMutation.mutate({ language: value } as Partial<NonNullable<typeof user>>)
  }

  function handleNotifToggle(key: keyof typeof notifications) {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    updateSettingsMutation.mutate(updated)
  }

  function handleReminderChange<K extends keyof typeof reminder>(key: K, value: (typeof reminder)[K]) {
    setReminder(prev => ({ ...prev, [key]: value }))
    const payload: Record<string, unknown> = { [key]: value }
    if (key === 'reminder_days') {
      payload.reminder_days = reminderDays.join(',')
    }
    updateSettingsMutation.mutate(payload as Partial<NonNullable<typeof settings>>)
  }

  function handleReminderDayToggle(day: string) {
    const next = reminderDays.includes(day)
      ? reminderDays.filter(d => d !== day)
      : [...reminderDays, day]
    setReminderDays(next)
    updateSettingsMutation.mutate({ reminder_days: next.join(',') } as Partial<NonNullable<typeof settings>>)
  }

  function handleSaveReminder() {
    updateSettingsMutation.mutate({
      reminder_enabled: reminder.reminder_enabled,
      reminder_time: reminder.reminder_time,
      reminder_frequency: reminder.reminder_frequency,
      reminder_days: reminderDays.join(','),
      reminder_amount: reminder.reminder_amount,
      reminder_title: reminder.reminder_title,
      reminder_message: reminder.reminder_message,
      reminder_timezone: reminder.reminder_timezone,
    } as Partial<NonNullable<typeof settings>>)
  }

  function handleBackup() {
    settingsService.backup().then((res) => {
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `moneysaver-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        settingsService.restore(data).then(() => {
          queryClient.invalidateQueries({ queryKey: ['settings'] })
        })
      } catch {
        alert('Invalid backup file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleConfirmAction() {
    if (confirmAction === 'reset') {
      settingsService.reset().then(() => {
        queryClient.invalidateQueries()
        setConfirmAction(null)
      })
    } else if (confirmAction === 'delete') {
      settingsService.deleteAccount().then(() => {
        localStorage.clear()
        logout()
        navigate('/login', { replace: true })
      })
    }
  }

  if (isLoading) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4 space-y-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="size-9 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
          ))}
        </div>
      </motion.main>
    )
  }

  return (
    <motion.main
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className="pb-28 px-4 pt-4 space-y-5"
    >
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center size-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Appearance</h2>
            <SettingRow label="Theme" description="Choose your app theme">
              <DropdownButton
                value={themeOptions.find((o) => o.value === theme)?.label ?? 'System'}
                isOpen={openDropdown === 'theme'}
                onClick={() => setOpenDropdown(openDropdown === 'theme' ? null : 'theme')}
              />
              {openDropdown === 'theme' && (
                <DropdownMenu>
                  {themeOptions.map((opt) => (
                    <DropdownItem
                      key={opt.value}
                      icon={<opt.icon className="size-4" />}
                      label={opt.label}
                      selected={theme === opt.value}
                      onClick={() => handleThemeChange(opt.value)}
                    />
                  ))}
                </DropdownMenu>
              )}
            </SettingRow>
            <SettingRow label="Currency" description="Default currency for amounts">
              <DropdownButton
                value={currency}
                isOpen={openDropdown === 'currency'}
                onClick={() => setOpenDropdown(openDropdown === 'currency' ? null : 'currency')}
              />
              {openDropdown === 'currency' && (
                <DropdownMenu>
                  {currencies.map((c) => (
                    <DropdownItem
                      key={c}
                      label={c}
                      selected={currency === c}
                      onClick={() => handleCurrencyChange(c)}
                    />
                  ))}
                </DropdownMenu>
              )}
            </SettingRow>
            <SettingRow label="Language" description="App display language">
              <DropdownButton
                value={languages.find((l) => l.code === language)?.name ?? 'English'}
                isOpen={openDropdown === 'language'}
                onClick={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
              />
              {openDropdown === 'language' && (
                <DropdownMenu>
                  {languages.map((l) => (
                    <DropdownItem
                      key={l.code}
                      label={l.name}
                      selected={language === l.code}
                      onClick={() => handleLanguageChange(l.code)}
                    />
                  ))}
                </DropdownMenu>
              )}
            </SettingRow>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              <HandCoins className="size-4 inline mr-1.5 text-emerald-500" />
              Deposit Settings
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 -mt-1">
              Money moves INTO your savings account
            </p>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setShowDepositImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Camera className="size-3.5" />
                Scan QR
              </button>
              <button
                type="button"
                onClick={() => setShowDepositImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <ClipboardPaste className="size-3.5" />
                Paste Link
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">UPI ID</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="example@paytm"
                    value={upiForm.upi_id}
                    onChange={(e) => handleUpiChange('upi_id', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  {upiForm.upi_id && (
                    <button
                      onClick={handleCopyUpiId}
                      className="flex items-center gap-1 px-3 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="size-3.5" />
                      {upiCopied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Receiver Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={upiForm.upi_name}
                  onChange={(e) => handleUpiChange('upi_name', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Preferred Payment App</label>
                <select
                  value={upiForm.preferred_upi_app}
                  onChange={(e) => handleUpiChange('preferred_upi_app', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">None (Show All)</option>
                  <option value="google_pay">Google Pay</option>
                  <option value="phone_pe">PhonePe</option>
                  <option value="paytm">Paytm</option>
                  <option value="bhim">BHIM</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Default Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={upiForm.default_save_amount || ''}
                  onChange={(e) => handleUpiChange('default_save_amount', e.target.value ? Number(e.target.value) : 0)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Default Note</label>
                <input
                  type="text"
                  placeholder="Savings deposit"
                  value={upiForm.default_save_note}
                  onChange={(e) => handleUpiChange('default_save_note', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleSaveUpi} fullWidth>
                Save All UPI Settings
              </Button>
            </div>
          </Card>
        </motion.div>

        <UPIImportDialog
          open={showDepositImport}
          onClose={() => setShowDepositImport(false)}
          onImport={handleDepositImport}
        />

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              <ArrowDownFromLine className="size-4 inline mr-1.5 text-red-500" />
              Withdrawal UPI Settings
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 -mt-1">
              Money moves OUT of your savings account into another account you own
            </p>

            {settings && !withdrawalUpiForm.withdrawal_upi_id && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-4">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Withdrawal UPI is not configured.</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Configure your Withdrawal UPI before using Quick Withdraw.</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setShowWithdrawalImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Camera className="size-3.5" />
                Scan QR
              </button>
              <button
                type="button"
                onClick={() => setShowWithdrawalImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <ClipboardPaste className="size-3.5" />
                Paste Link
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">UPI ID</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="example@paytm"
                    value={withdrawalUpiForm.withdrawal_upi_id}
                    onChange={(e) => { handleWithdrawalUpiChange('withdrawal_upi_id', e.target.value); if (withdrawalUpiErrors.withdrawal_upi_id) setWithdrawalUpiErrors(p => { const n = { ...p }; delete n.withdrawal_upi_id; return n }) }}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                      withdrawalUpiErrors.withdrawal_upi_id ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
                    )}
                  />
                  {withdrawalUpiForm.withdrawal_upi_id && (
                    <button
                      onClick={handleCopyWithdrawalUpiId}
                      className="flex items-center gap-1 px-3 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="size-3.5" />
                      {wdUpiCopied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                {withdrawalUpiErrors.withdrawal_upi_id && (
                  <p className="text-xs text-red-500 mt-1">{withdrawalUpiErrors.withdrawal_upi_id}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Receiver Name</label>
                <input
                  type="text"
                  placeholder="Your Other Account"
                  value={withdrawalUpiForm.withdrawal_upi_name}
                  onChange={(e) => { handleWithdrawalUpiChange('withdrawal_upi_name', e.target.value); if (withdrawalUpiErrors.withdrawal_upi_name) setWithdrawalUpiErrors(p => { const n = { ...p }; delete n.withdrawal_upi_name; return n }) }}
                  className={cn(
                    'mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                    withdrawalUpiErrors.withdrawal_upi_name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
                  )}
                />
                {withdrawalUpiErrors.withdrawal_upi_name && (
                  <p className="text-xs text-red-500 mt-1">{withdrawalUpiErrors.withdrawal_upi_name}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Preferred Payment App</label>
                <select
                  value={withdrawalUpiForm.withdrawal_preferred_upi_app}
                  onChange={(e) => { handleWithdrawalUpiChange('withdrawal_preferred_upi_app', e.target.value); if (withdrawalUpiErrors.withdrawal_preferred_upi_app) setWithdrawalUpiErrors(p => { const n = { ...p }; delete n.withdrawal_preferred_upi_app; return n }) }}
                  className={cn(
                    'mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                    withdrawalUpiErrors.withdrawal_preferred_upi_app ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
                  )}
                >
                  <option value="">None (Show All)</option>
                  <option value="google_pay">Google Pay</option>
                  <option value="phone_pe">PhonePe</option>
                  <option value="paytm">Paytm</option>
                  <option value="bhim">BHIM</option>
                </select>
                {withdrawalUpiErrors.withdrawal_preferred_upi_app && (
                  <p className="text-xs text-red-500 mt-1">{withdrawalUpiErrors.withdrawal_preferred_upi_app}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Default Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={withdrawalUpiForm.withdrawal_default_amount || ''}
                  onChange={(e) => { handleWithdrawalUpiChange('withdrawal_default_amount', e.target.value ? Number(e.target.value) : 0); if (withdrawalUpiErrors.withdrawal_default_amount) setWithdrawalUpiErrors(p => { const n = { ...p }; delete n.withdrawal_default_amount; return n }) }}
                  className={cn(
                    'mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                    withdrawalUpiErrors.withdrawal_default_amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
                  )}
                />
                {withdrawalUpiErrors.withdrawal_default_amount && (
                  <p className="text-xs text-red-500 mt-1">{withdrawalUpiErrors.withdrawal_default_amount}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Default Note</label>
                <input
                  type="text"
                  placeholder="Transfer to my account"
                  value={withdrawalUpiForm.withdrawal_default_note}
                  onChange={(e) => handleWithdrawalUpiChange('withdrawal_default_note', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleSaveWithdrawalUpi}
                  fullWidth
                  loading={updateSettingsMutation.isPending}
                >
                  Save Withdrawal Settings
                </Button>
                {withdrawalSaveSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium"
                  >
                    Withdrawal settings saved successfully
                  </motion.p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <UPIImportDialog
          open={showWithdrawalImport}
          onClose={() => setShowWithdrawalImport(false)}
          onImport={handleWithdrawalImport}
        />

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              <Zap className="size-4 inline mr-1.5 text-amber-500" />
              Quick Save Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Preset Amounts
                </label>
                <div className="space-y-2">
                  {qsPresets.filter(p => p.id !== 'qs-custom').map((preset) => (
                    <div key={preset.id} className="flex items-center gap-2">
                      <GripVertical className="size-4 text-gray-300 dark:text-gray-600 shrink-0" />
                      {editingPreset === preset.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="number"
                            value={qsPresets.find(p => p.id === preset.id)?.amount || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              setPresets(qsPresets.map(p => p.id === preset.id ? { ...p, amount: val, label: val > 0 ? `₹${val}` : p.label } : p))
                            }}
                            className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <button
                            onClick={() => setEditingPreset(null)}
                            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {preset.label}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingPreset(editingPreset === preset.id ? null : preset.id)}
                        className="px-2 py-1 rounded text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPresets(qsPresets.filter(p => p.id !== preset.id))}
                        className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {newPresetAmount && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={newPresetLabel}
                      onChange={(e) => setNewPresetLabel(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button
                      onClick={() => {
                        const amount = Number(newPresetAmount)
                        if (amount > 0) {
                          const id = `qs-custom-${Date.now()}`
                          setPresets([...qsPresets.filter(p => p.id !== 'qs-custom'), {
                            id,
                            amount,
                            label: newPresetLabel || `₹${amount}`,
                            order: qsPresets.length - 1,
                          }])
                          setNewPresetAmount('')
                          setNewPresetLabel('')
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setNewPresetAmount(''); setNewPresetLabel('') }}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setNewPresetAmount('1')}
                  className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                >
                  <Plus className="size-3.5" />
                  Add Preset
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-3 space-y-3">
                <SettingRow label="Remember Last Amount" description="Show 'Save Again' with last amount">
                  <ToggleSwitch
                    checked={qsConfig.rememberLastAmount}
                    onChange={() => updateConfig({ rememberLastAmount: !qsConfig.rememberLastAmount })}
                  />
                </SettingRow>
                <SettingRow label="Remember Last Goal" description="Reuse last linked goal for quick saves">
                  <ToggleSwitch
                    checked={qsConfig.rememberLastGoal}
                    onChange={() => updateConfig({ rememberLastGoal: !qsConfig.rememberLastGoal })}
                  />
                </SettingRow>
                <SettingRow label="Confirm Before Launch" description="Ask before opening UPI app">
                  <ToggleSwitch
                    checked={qsConfig.confirmBeforeLaunch}
                    onChange={() => updateConfig({ confirmBeforeLaunch: !qsConfig.confirmBeforeLaunch })}
                  />
                </SettingRow>
                <SettingRow label="Auto-Open Preferred App" description="Skip app selection, open preferred app directly">
                  <ToggleSwitch
                    checked={qsConfig.autoOpenPreferredApp}
                    onChange={() => updateConfig({ autoOpenPreferredApp: !qsConfig.autoOpenPreferredApp })}
                  />
                </SettingRow>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              <ArrowDownFromLine className="size-4 inline mr-1.5 text-red-500" />
              Quick Withdraw Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Preset Amounts
                </label>
                <div className="space-y-2">
                  {wdPresets.filter(p => p.id !== 'wd-custom').map((preset) => (
                    <div key={preset.id} className="flex items-center gap-2">
                      <GripVertical className="size-4 text-gray-300 dark:text-gray-600 shrink-0" />
                      {editingWdPreset === preset.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="number"
                            value={wdPresets.find(p => p.id === preset.id)?.amount || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              setWdPresets(wdPresets.map(p => p.id === preset.id ? { ...p, amount: val, label: val > 0 ? `₹${val}` : p.label } : p))
                            }}
                            className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          />
                          <button
                            onClick={() => setEditingWdPreset(null)}
                            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {preset.label}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingWdPreset(editingWdPreset === preset.id ? null : preset.id)}
                        className="px-2 py-1 rounded text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setWdPresets(wdPresets.filter(p => p.id !== preset.id))}
                        className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {newWdPresetAmount && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={newWdPresetLabel}
                      onChange={(e) => setNewWdPresetLabel(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <button
                      onClick={() => {
                        const amount = Number(newWdPresetAmount)
                        if (amount > 0) {
                          const id = `wd-custom-${Date.now()}`
                          setWdPresets([...wdPresets.filter(p => p.id !== 'wd-custom'), {
                            id,
                            amount,
                            label: newWdPresetLabel || `₹${amount}`,
                            order: wdPresets.length - 1,
                          }])
                          setNewWdPresetAmount('')
                          setNewWdPresetLabel('')
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setNewWdPresetAmount(''); setNewWdPresetLabel('') }}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setNewWdPresetAmount('1')}
                  className="flex items-center gap-1.5 mt-2 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700"
                >
                  <Plus className="size-3.5" />
                  Add Preset
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-3 space-y-3">
                <SettingRow label="Remember Last Amount" description="Show 'Withdraw Again' with last amount">
                  <ToggleSwitch
                    checked={wdConfig.rememberLastAmount}
                    onChange={() => updateWdConfig({ rememberLastAmount: !wdConfig.rememberLastAmount })}
                  />
                </SettingRow>
                <SettingRow label="Remember Last Goal" description="Reuse last linked goal for quick withdraws">
                  <ToggleSwitch
                    checked={wdConfig.rememberLastGoal}
                    onChange={() => updateWdConfig({ rememberLastGoal: !wdConfig.rememberLastGoal })}
                  />
                </SettingRow>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              <ArrowDownFromLine className="size-4 inline mr-1.5 text-red-500" />
              Withdrawal Settings
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-1">
              Configure your bank account details and withdrawal behavior
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Preferred Banking App
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC, ICICI, SBI"
                  value={wdConfig.preferredBankingApp}
                  onChange={(e) => updateWdConfig({ preferredBankingApp: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Savings Account Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Savings, Emergency Fund"
                  value={wdConfig.savingsAccountNickname}
                  onChange={(e) => updateWdConfig({ savingsAccountNickname: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Account Hint (Last 4 Digits)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234"
                  maxLength={4}
                  value={wdConfig.accountHint}
                  onChange={(e) => updateWdConfig({ accountHint: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                {wdConfig.accountHint && (
                  <p className="text-xs text-gray-400 mt-1">
                    Showing: <span className="font-mono font-medium text-gray-600 dark:text-gray-300">XXXX{wdConfig.accountHint}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Default Withdrawal Reason
                </label>
                <select
                  value={wdConfig.defaultWithdrawReason}
                  onChange={(e) => updateWdConfig({ defaultWithdrawReason: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <option value="Emergency">Emergency</option>
                  <option value="Bill Payment">Bill Payment</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Rent">Rent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-3 space-y-3">
                <SettingRow label="Remember Last Withdrawal" description="Show 'Withdraw Again' with last amount">
                  <ToggleSwitch
                    checked={wdConfig.rememberLastAmount}
                    onChange={() => updateWdConfig({ rememberLastAmount: !wdConfig.rememberLastAmount })}
                  />
                </SettingRow>
                <SettingRow label="Auto-Open Preferred Bank App" description="Skip confirmation, launch banking app directly">
                  <ToggleSwitch
                    checked={wdConfig.autoOpenBankingApp}
                    onChange={() => updateWdConfig({ autoOpenBankingApp: !wdConfig.autoOpenBankingApp })}
                  />
                </SettingRow>
                <SettingRow label="Confirm Before Recording" description="Always ask 'Did you complete?' before recording">
                  <ToggleSwitch
                    checked={wdConfig.confirmBeforeWithdrawal}
                    onChange={() => updateWdConfig({ confirmBeforeWithdrawal: !wdConfig.confirmBeforeWithdrawal })}
                  />
                </SettingRow>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Security</h2>
            <SettingRow label="App PIN" description="Set or change your app PIN">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert('Change PIN coming soon!')}
              >
                {settings?.pin_enabled ? 'Change' : 'Set'}
              </Button>
            </SettingRow>
            <SettingRow label="Biometric Login" description="Use fingerprint or face to unlock">
              <ToggleSwitch
                checked={settings?.biometric_enabled ?? false}
                onChange={() =>
                  updateSettingsMutation.mutate({
                    biometric_enabled: !settings?.biometric_enabled,
                  } as Partial<NonNullable<typeof settings>>)
                }
              />
            </SettingRow>
            <SettingRow label="Auto Lock" description="Lock app after inactivity">
              <select
                value={settings?.auto_lock_minutes ?? 0}
                onChange={(e) =>
                  updateSettingsMutation.mutate({
                    auto_lock_minutes: Number(e.target.value),
                  } as Partial<NonNullable<typeof settings>>)
                }
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value={0}>Off</option>
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </SettingRow>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Notifications</h2>
            <SettingRow label="Daily Reminder" description="Get reminded to save daily">
              <ToggleSwitch
                checked={notifications.daily_reminder}
                onChange={() => handleNotifToggle('daily_reminder')}
              />
            </SettingRow>
            <SettingRow label="Goal Reminder" description="Reminders about goal deadlines">
              <ToggleSwitch
                checked={notifications.goal_reminder}
                onChange={() => handleNotifToggle('goal_reminder')}
              />
            </SettingRow>
            <SettingRow label="Achievement Alerts" description="Get notified on new achievements">
              <ToggleSwitch
                checked={notifications.achievement_notification}
                onChange={() => handleNotifToggle('achievement_notification')}
              />
            </SettingRow>
            <SettingRow label="Monthly Report" description="Receive monthly savings report">
              <ToggleSwitch
                checked={notifications.monthly_report}
                onChange={() => handleNotifToggle('monthly_report')}
              />
            </SettingRow>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              <Bell className="size-4 inline mr-1.5 text-purple-500" />
              Smart Reminder
            </h2>
            <SettingRow label="Enable Reminder" description="Receive daily push reminders to save">
              <ToggleSwitch
                checked={reminder.reminder_enabled}
                onChange={() => handleReminderChange('reminder_enabled', !reminder.reminder_enabled)}
              />
            </SettingRow>

            <div className="py-3 border-b border-gray-100 dark:border-gray-700/50">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                <Clock className="size-3 inline mr-1" />
                Reminder Time
              </label>
              <input
                type="time"
                value={reminder.reminder_time}
                onChange={(e) => handleReminderChange('reminder_time', e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="py-3 border-b border-gray-100 dark:border-gray-700/50">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Reminder Frequency
              </label>
              <select
                value={reminder.reminder_frequency}
                onChange={(e) => handleReminderChange('reminder_frequency', e.target.value as typeof reminder.reminder_frequency)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="custom">Custom Days</option>
              </select>
            </div>

            {reminder.reminder_frequency === 'custom' && (
              <div className="py-3 border-b border-gray-100 dark:border-gray-700/50">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Select Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '1', label: 'Mon' },
                    { value: '2', label: 'Tue' },
                    { value: '3', label: 'Wed' },
                    { value: '4', label: 'Thu' },
                    { value: '5', label: 'Fri' },
                    { value: '6', label: 'Sat' },
                    { value: '0', label: 'Sun' },
                  ].map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleReminderDayToggle(day.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                        reminderDays.includes(day.value)
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600',
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="py-3 border-b border-gray-100 dark:border-gray-700/50">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Reminder Amount (Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={reminder.reminder_amount || ''}
                onChange={(e) => handleReminderChange('reminder_amount', Math.max(0, Number(e.target.value)))}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-32"
              />
            </div>

            <div className="py-3 border-b border-gray-100 dark:border-gray-700/50">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Reminder Title
              </label>
              <input
                type="text"
                value={reminder.reminder_title}
                onChange={(e) => handleReminderChange('reminder_title', e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="py-3 border-b border-gray-100 dark:border-gray-700/50">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Reminder Message
              </label>
              <input
                type="text"
                value={reminder.reminder_message}
                onChange={(e) => handleReminderChange('reminder_message', e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="py-3 border-b border-gray-100 dark:border-gray-700/50">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                <Globe className="size-3 inline mr-1" />
                Time Zone
              </label>
              <select
                value={reminder.reminder_timezone}
                onChange={(e) => handleReminderChange('reminder_timezone', e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="UTC">UTC</option>
                <option value="US/Eastern">US/Eastern (ET)</option>
                <option value="US/Central">US/Central (CT)</option>
                <option value="US/Mountain">US/Mountain (MT)</option>
                <option value="US/Pacific">US/Pacific (PT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Europe/Moscow">Europe/Moscow (MSK)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                <option value="Pacific/Auckland">Pacific/Auckland (NZST)</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                <option value="America/Argentina/Buenos_Aires">America/Buenos_Aires (ART)</option>
                <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              </select>
            </div>

            <div className="pt-3">
              <Button variant="primary" size="sm" onClick={handleSaveReminder} fullWidth>
                <Save className="size-4 mr-1.5 inline" />
                Save Reminder Settings
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Data</h2>
            <ActionRow
              icon={<Download className="size-4" />}
              label="Export Data"
              description="Download your data as JSON"
              onClick={handleBackup}
            />
            <ActionRow
              icon={<Upload className="size-4" />}
              label="Import Data"
              description="Import from a JSON backup"
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestore}
            />
            <ActionRow
              icon={<RotateCcw className="size-4" />}
              label="Reset App"
              description="Clear all data and settings"
              onClick={() => setConfirmAction('reset')}
            />
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Privacy</h2>
            <LinkRow
              icon={<BookOpen className="size-4" />}
              label="Privacy Policy"
              href="#"
            />
            <LinkRow
              icon={<FileText className="size-4" />}
              label="Terms of Service"
              href="#"
            />
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h2>
            <InfoRow label="App Version" value="1.0.0" />
            <InfoRow label="Build Number" value="2024.1" />
            <LinkRow
              icon={<Info className="size-4" />}
              label="Licenses"
              href="#"
            />
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <button
              onClick={() => setConfirmAction('delete')}
              className="flex w-full items-center gap-3 py-2 text-left"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <Trash2 className="size-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete account and all data</p>
              </div>
            </button>
          </Card>
        </motion.div>
      </motion.div>

      <Modal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'reset' ? 'Reset Application' : 'Delete Account'}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {confirmAction === 'reset'
            ? 'This will clear all your app data and reset settings to default. This action cannot be undone.'
            : 'This will permanently delete your account and all associated data. This action cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setConfirmAction(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleConfirmAction}
            loading={updateSettingsMutation.isPending || updateProfileMutation.isPending}
          >
            {confirmAction === 'reset' ? 'Reset' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </motion.main>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="relative shrink-0">{children}</div>
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700',
      )}
    >
      <span
        className={cn(
          'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

function DropdownButton({
  value,
  isOpen,
  onClick,
}: {
  value: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        'border border-gray-200 dark:border-gray-700',
        'text-gray-700 dark:text-gray-300',
        'hover:bg-gray-50 dark:hover:bg-gray-800',
        isOpen && 'ring-2 ring-emerald-500/50',
      )}
    >
      {value}
      <ChevronDown className={cn('size-3.5 transition-transform', isOpen && 'rotate-180')} />
    </button>
  )
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      className="absolute right-0 top-full mt-1 z-20 min-w-[160px] py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
    >
      {children}
    </motion.div>
  )
}

function DropdownItem({
  icon,
  label,
  selected,
  onClick,
}: {
  icon?: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
        selected
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
      )}
    >
      {selected && <Check className="size-3.5 shrink-0" />}
      {icon && <span className={cn(!selected && 'ml-5')}>{icon}</span>}
      <span>{label}</span>
    </button>
  )
}

function ActionRow({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0"
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </button>
  )
}

function LinkRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center gap-3 py-3 text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      </div>
      <ExternalLink className="size-4 text-gray-400 shrink-0" />
    </a>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{value}</p>
    </div>
  )
}
