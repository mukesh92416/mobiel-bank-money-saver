import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Camera,
  Mail,
  ChevronDown,
  Check,
  Moon,
  Bell,
  Goal,
  Award,
  FileText,
  Shield,
  Fingerprint,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Info,
  User,
  Save,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authService } from '@/services/authService'
import { settingsService } from '@/services/settingsService'
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

type ConfirmAction = 'reset' | 'delete' | null

export default function Profile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { isDark, toggle: toggleDark } = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name ?? '')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [openSelector, setOpenSelector] = useState<'currency' | 'language' | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency ?? 'INR')
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language ?? 'en')

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  })

  const settings = settingsData?.settings
  const [notifPrefs, setNotifPrefs] = useState({
    daily_reminder: settings?.daily_reminder ?? true,
    goal_reminder: settings?.goal_reminder ?? true,
    achievement_notification: settings?.achievement_notification ?? true,
    monthly_report: settings?.monthly_report ?? true,
  })

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const updateProfileMutation = useMutation({
    mutationFn: (data: Parameters<typeof authService.updateProfile>[0]) =>
      authService.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.user)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Parameters<typeof settingsService.update>[0]) =>
      settingsService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  function handleSaveName() {
    if (!nameInput.trim() || nameInput === user?.name) {
      setEditingName(false)
      return
    }
    updateProfileMutation.mutate(
      { name: nameInput.trim() } as Partial<NonNullable<typeof user>>,
      { onSettled: () => setEditingName(false) },
    )
  }

  function handleCurrencyChange(currency: string) {
    setSelectedCurrency(currency)
    setOpenSelector(null)
    updateProfileMutation.mutate({ currency } as Partial<NonNullable<typeof user>>)
    updateSettingsMutation.mutate({ currency })
  }

  function handleLanguageChange(language: string) {
    setSelectedLanguage(language)
    setOpenSelector(null)
    updateProfileMutation.mutate({ language } as Partial<NonNullable<typeof user>>)
    updateSettingsMutation.mutate({ language })
  }

  function handleDarkToggle() {
    toggleDark()
    updateProfileMutation.mutate({ dark_mode: !isDark } as Partial<NonNullable<typeof user>>)
  }

  function handleNotifToggle(key: keyof typeof notifPrefs) {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    updateSettingsMutation.mutate(updated)
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
        window.location.href = '/login'
      })
    }
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="lg" className="text-center">
            <div className="relative inline-block">
              <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-3xl font-bold ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/20">
                {initials ?? <User className="size-8" />}
              </div>
              <button
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-colors"
                aria-label="Change avatar"
              >
                <Camera className="size-4" />
              </button>
            </div>

            <div className="mt-4">
              {editingName ? (
                <div className="flex items-center justify-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-48 text-center"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Save className="size-4" />}
                    onClick={handleSaveName}
                    loading={updateProfileMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {user?.name ?? 'User'}
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-center gap-1.5">
              <Mail className="size-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</span>
              {user?.email_verified && (
                <Badge variant="success" size="sm" dot>
                  Verified
                </Badge>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Preferences</h2>
            <div className="space-y-1">
              <SettingRow label="Currency" description="Your preferred currency">
                <SelectorButton
                  value={selectedCurrency}
                  isOpen={openSelector === 'currency'}
                  onClick={() => setOpenSelector(openSelector === 'currency' ? null : 'currency')}
                />
                {openSelector === 'currency' && (
                  <SelectorDropdown
                    options={currencies}
                    selected={selectedCurrency}
                    onSelect={handleCurrencyChange}
                  />
                )}
              </SettingRow>
              <SettingRow label="Language" description="App display language">
                <SelectorButton
                  value={languages.find((l) => l.code === selectedLanguage)?.name ?? 'English'}
                  isOpen={openSelector === 'language'}
                  onClick={() => setOpenSelector(openSelector === 'language' ? null : 'language')}
                />
                {openSelector === 'language' && (
                  <SelectorDropdown
                    options={languages.map((l) => l.name)}
                    selected={languages.find((l) => l.code === selectedLanguage)?.name ?? 'English'}
                    onSelect={(name) => {
                      const lang = languages.find((l) => l.name === name)
                      if (lang) handleLanguageChange(lang.code)
                    }}
                  />
                )}
              </SettingRow>
              <ToggleRow
                icon={<Moon className="size-4" />}
                label="Dark Mode"
                description="Toggle dark theme"
                checked={isDark}
                onChange={handleDarkToggle}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Notifications</h2>
            <div className="space-y-1">
              <ToggleRow
                icon={<Bell className="size-4" />}
                label="Daily Reminder"
                description="Get reminded to save daily"
                checked={notifPrefs.daily_reminder}
                onChange={() => handleNotifToggle('daily_reminder')}
              />
              <ToggleRow
                icon={<Goal className="size-4" />}
                label="Goal Reminder"
                description="Reminders about goal deadlines"
                checked={notifPrefs.goal_reminder}
                onChange={() => handleNotifToggle('goal_reminder')}
              />
              <ToggleRow
                icon={<Award className="size-4" />}
                label="Achievement Notifications"
                description="Get notified when you unlock achievements"
                checked={notifPrefs.achievement_notification}
                onChange={() => handleNotifToggle('achievement_notification')}
              />
              <ToggleRow
                icon={<FileText className="size-4" />}
                label="Monthly Report"
                description="Receive monthly savings report"
                checked={notifPrefs.monthly_report}
                onChange={() => handleNotifToggle('monthly_report')}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Security</h2>
            <div className="space-y-1">
              <button
                onClick={() => alert('Change PIN coming soon!')}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                  <Shield className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Change PIN</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Set or update your app PIN</p>
                </div>
                <ChevronDown className="size-4 text-gray-400 -rotate-90" />
              </button>
              <ToggleRow
                icon={<Fingerprint className="size-4" />}
                label="Biometric Login"
                description="Use fingerprint or face to login"
                checked={settings?.biometric_enabled ?? false}
                onChange={() =>
                  updateSettingsMutation.mutate({
                    biometric_enabled: !settings?.biometric_enabled,
                  } as Partial<NonNullable<typeof settings>>)
                }
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card variant="glass" padding="md">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Data</h2>
            <div className="space-y-1">
              <button
                onClick={handleBackup}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Download className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Backup Data</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Download your data as JSON</p>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                  <Upload className="size-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Restore Data</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Import from a backup file</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleRestore}
              />

              <button
                onClick={() => setConfirmAction('reset')}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Reset Application</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clear all app data and settings</p>
                </div>
              </button>
            </div>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete your account and data</p>
              </div>
            </button>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="text-center pb-8">
          <div className="flex items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500">
            <Info className="size-3.5" />
            <span className="text-xs">MoneySaver v1.0.0</span>
          </div>
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
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setConfirmAction(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleConfirmAction}
            loading={updateProfileMutation.isPending || updateSettingsMutation.isPending}
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
    <div className="flex items-center justify-between py-3 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="relative shrink-0">{children}</div>
    </div>
  )
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0" onClick={onChange}>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
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
    </div>
  )
}

function SelectorButton({
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

function SelectorDropdown({
  options,
  selected,
  onSelect,
}: {
  options: string[]
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      className="absolute right-0 top-full mt-1 z-20 w-36 py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
            opt === selected
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
          )}
        >
          {opt === selected && <Check className="size-3.5 shrink-0" />}
          <span className={cn(!opt.includes(selected) && 'ml-5')}>{opt}</span>
        </button>
      ))}
    </motion.div>
  )
}
