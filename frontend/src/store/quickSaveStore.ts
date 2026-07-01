import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  QuickSavePreset, QuickSaveSession, LastSave, QuickSaveConfig,
  WithdrawPreset, WithdrawSession, LastWithdraw, WithdrawConfig,
} from '@/types'

const DEFAULT_PRESETS: QuickSavePreset[] = [
  { id: 'qs-50', amount: 50, label: '₹50', order: 0 },
  { id: 'qs-100', amount: 100, label: '₹100', order: 1 },
  { id: 'qs-200', amount: 200, label: '₹200', order: 2 },
  { id: 'qs-500', amount: 500, label: '₹500', order: 3 },
  { id: 'qs-1000', amount: 1000, label: '₹1000', order: 4 },
  { id: 'qs-custom', amount: 0, label: 'Custom', order: 5 },
]

const DEFAULT_WITHDRAW_PRESETS: WithdrawPreset[] = [
  { id: 'wd-500', amount: 500, label: '₹500', order: 0 },
  { id: 'wd-1000', amount: 1000, label: '₹1000', order: 1 },
  { id: 'wd-2000', amount: 2000, label: '₹2000', order: 2 },
  { id: 'wd-5000', amount: 5000, label: '₹5000', order: 3 },
  { id: 'wd-custom', amount: 0, label: 'Custom', order: 4 },
]

interface PendingDeposit {
  amount: number
  goalId?: number | null
  transactionDate?: string
  notes?: string
}

interface PendingWithdraw {
  amount: number
  goalId?: number | null
}

interface QuickSaveState {
  presets: QuickSavePreset[]
  lastSave: LastSave | null
  sessions: QuickSaveSession[]
  config: QuickSaveConfig
  appLaunchTime: number | null
  confirmedSessionIds: string[]
  pendingDeposit: PendingDeposit | null

  withdrawPresets: WithdrawPreset[]
  lastWithdraw: LastWithdraw | null
  withdrawSessions: WithdrawSession[]
  withdrawConfig: WithdrawConfig
  withdrawAppLaunchTime: number | null
  confirmedWithdrawSessionIds: string[]
  pendingWithdraw: PendingWithdraw | null

  setPresets: (presets: QuickSavePreset[]) => void
  updatePreset: (id: string, updates: Partial<QuickSavePreset>) => void
  removePreset: (id: string) => void
  addPreset: (preset: QuickSavePreset) => void
  reorderPresets: (presets: QuickSavePreset[]) => void
  setLastSave: (lastSave: LastSave) => void
  addSession: (session: QuickSaveSession) => void
  updateSession: (id: string, updates: Partial<QuickSaveSession>) => void
  clearSessions: () => void
  updateConfig: (updates: Partial<QuickSaveConfig>) => void
  getActiveSession: () => QuickSaveSession | null
  setAppLaunchTime: (time: number | null) => void
  setPendingDeposit: (data: PendingDeposit | null) => void
  addConfirmedSession: (id: string) => void
  isSessionConfirmed: (id: string) => boolean

  setWithdrawPresets: (presets: WithdrawPreset[]) => void
  updateWithdrawPreset: (id: string, updates: Partial<WithdrawPreset>) => void
  removeWithdrawPreset: (id: string) => void
  addWithdrawPreset: (preset: WithdrawPreset) => void
  reorderWithdrawPresets: (presets: WithdrawPreset[]) => void
  setLastWithdraw: (lastWithdraw: LastWithdraw) => void
  addWithdrawSession: (session: WithdrawSession) => void
  updateWithdrawSession: (id: string, updates: Partial<WithdrawSession>) => void
  clearWithdrawSessions: () => void
  updateWithdrawConfig: (updates: Partial<WithdrawConfig>) => void
  getActiveWithdrawSession: () => WithdrawSession | null
  setWithdrawAppLaunchTime: (time: number | null) => void
  setPendingWithdraw: (data: PendingWithdraw | null) => void
  addConfirmedWithdrawSession: (id: string) => void
  isWithdrawSessionConfirmed: (id: string) => boolean
}

export const useQuickSaveStore = create<QuickSaveState>()(
  persist(
    (set, get) => ({
      presets: DEFAULT_PRESETS,
      lastSave: null,
      sessions: [],
      config: {
        presets: DEFAULT_PRESETS,
        rememberLastAmount: true,
        rememberLastGoal: true,
        confirmBeforeLaunch: false,
        autoOpenPreferredApp: true,
        confirmationTimeout: 300,
      },
      appLaunchTime: null,
      confirmedSessionIds: [],
      pendingDeposit: null,

      withdrawPresets: DEFAULT_WITHDRAW_PRESETS,
      lastWithdraw: null,
      withdrawSessions: [],
      withdrawConfig: {
        presets: DEFAULT_WITHDRAW_PRESETS,
        rememberLastAmount: true,
        rememberLastGoal: true,
        preferredBankingApp: '',
        savingsAccountNickname: '',
        accountHint: '',
        defaultWithdrawReason: 'Other',
        autoOpenBankingApp: true,
        confirmBeforeWithdrawal: true,
      },
      withdrawAppLaunchTime: null,
      confirmedWithdrawSessionIds: [],
      pendingWithdraw: null,

      setPresets: (presets) => set({ presets }),

      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      removePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),

      addPreset: (preset) =>
        set((state) => ({
          presets: [...state.presets, preset],
        })),

      reorderPresets: (presets) => set({ presets }),

      setLastSave: (lastSave) => set({ lastSave }),

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions].slice(0, 50),
        })),

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      clearSessions: () => set({ sessions: [] }),

      updateConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),

      getActiveSession: () => {
        const state = get()
        return state.sessions.find((s) => s.status === 'pending') ?? null
      },

      setAppLaunchTime: (time) => set({ appLaunchTime: time }),

      setPendingDeposit: (data) => set({ pendingDeposit: data }),

      addConfirmedSession: (id) =>
        set((state) => ({
          confirmedSessionIds: [...state.confirmedSessionIds, id],
        })),

      isSessionConfirmed: (id) => {
        return get().confirmedSessionIds.includes(id)
      },

      setWithdrawPresets: (presets) => set({ withdrawPresets: presets }),

      updateWithdrawPreset: (id, updates) =>
        set((state) => ({
          withdrawPresets: state.withdrawPresets.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removeWithdrawPreset: (id) =>
        set((state) => ({
          withdrawPresets: state.withdrawPresets.filter((p) => p.id !== id),
        })),

      addWithdrawPreset: (preset) =>
        set((state) => ({
          withdrawPresets: [...state.withdrawPresets, preset],
        })),

      reorderWithdrawPresets: (presets) => set({ withdrawPresets: presets }),

      setLastWithdraw: (lastWithdraw) => set({ lastWithdraw }),

      addWithdrawSession: (session) =>
        set((state) => ({
          withdrawSessions: [session, ...state.withdrawSessions].slice(0, 50),
        })),

      updateWithdrawSession: (id, updates) =>
        set((state) => ({
          withdrawSessions: state.withdrawSessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      clearWithdrawSessions: () => set({ withdrawSessions: [] }),

      updateWithdrawConfig: (updates) =>
        set((state) => ({
          withdrawConfig: { ...state.withdrawConfig, ...updates },
        })),

      getActiveWithdrawSession: () => {
        const state = get()
        return state.withdrawSessions.find((s) => s.status === 'pending') ?? null
      },

      setWithdrawAppLaunchTime: (time) => set({ withdrawAppLaunchTime: time }),

      setPendingWithdraw: (data) => set({ pendingWithdraw: data }),

      addConfirmedWithdrawSession: (id) =>
        set((state) => ({
          confirmedWithdrawSessionIds: [...state.confirmedWithdrawSessionIds, id],
        })),

      isWithdrawSessionConfirmed: (id) => {
        return get().confirmedWithdrawSessionIds.includes(id)
      },
    }),
    {
      name: 'moneysaver-quick-save',
      partialize: (state) => ({
        presets: state.presets,
        lastSave: state.lastSave,
        sessions: state.sessions,
        config: state.config,
        confirmedSessionIds: state.confirmedSessionIds,
        withdrawPresets: state.withdrawPresets,
        lastWithdraw: state.lastWithdraw,
        withdrawSessions: state.withdrawSessions,
        withdrawConfig: state.withdrawConfig,
        confirmedWithdrawSessionIds: state.confirmedWithdrawSessionIds,
      }),
    }
  )
)
