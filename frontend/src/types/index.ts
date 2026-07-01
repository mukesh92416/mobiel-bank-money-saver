export interface User {
  id: number
  email: string
  name: string
  avatar: string | null
  currency: string
  language: string
  dark_mode: boolean
  email_verified: boolean
  biometric_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Goal {
  id: number
  user_id: number
  title: string
  target_amount: number
  current_amount: number
  deadline: string | null
  priority: string
  color_theme: string
  icon: string
  completed: boolean
  completed_at: string | null
  progress: number
  remaining: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  user_id: number
  goal_id: number | null
  type: 'deposit' | 'withdrawal'
  amount: number
  category: string | null
  description: string | null
  notes: string | null
  transaction_date: string
  goal_title: string | null
  created_at: string
}

export interface Achievement {
  id: number
  user_id: number
  name: string
  description: string | null
  icon: string
  unlocked: boolean
  unlocked_at: string | null
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string | null
  type: string
  read: boolean
  read_at: string | null
  created_at: string
}

export interface AppSettings {
  id: number
  user_id: number
  theme: string
  currency: string
  language: string
  daily_reminder: boolean
  goal_reminder: boolean
  achievement_notification: boolean
  monthly_report: boolean
  pin_enabled: boolean
  biometric_enabled: boolean
  upi_id: string | null
  upi_name: string | null
  preferred_upi_app: string | null
  default_save_amount: number
  default_save_note: string | null
  withdrawal_upi_id: string | null
  withdrawal_upi_name: string | null
  withdrawal_preferred_upi_app: string | null
  withdrawal_default_amount: number
  withdrawal_default_note: string | null
  auto_lock_minutes: number
  created_at: string
  updated_at: string
}

export interface AnalyticsSummary {
  balance: number
  total_deposits: number
  total_withdrawals: number
  today_deposits: number
  weekly_deposits: number
  monthly_deposits: number
  yearly_deposits: number
  total_goals: number
  completed_goals: number
  transaction_count: number
  month_over_month_change: number | null
  active_goal: Goal | null
}

export interface TrendDataPoint {
  date?: string
  month?: string
  deposits: number
  withdrawals: number
}

export interface CategoryData {
  category: string
  amount: number
  count: number
}

export interface StreakData {
  current_streak: number
  longest_streak: number
}

export interface AuthResponse {
  message: string
  user: User
  access_token: string
  refresh_token?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface DepositInput {
  amount: number
  category?: string
  goal_id?: number | null
  description?: string
  transaction_date?: string
  notes?: string
}

export interface WithdrawInput {
  amount: number
  goal_id?: number | null
  transaction_date: string
  notes?: string
}

export interface GoalInput {
  title: string
  target_amount: number
  deadline?: string | null
  priority?: string
  color_theme?: string
  icon?: string
}

export interface UpiQrProfile {
  upi_id: string
  upi_name: string
}

export interface UpiSettings {
  upi_id: string | null
  upi_name: string | null
  preferred_upi_app: string | null
  default_save_amount: number
  default_save_note: string | null
  withdrawal_upi_id: string | null
  withdrawal_upi_name: string | null
  withdrawal_preferred_upi_app: string | null
  withdrawal_default_amount: number
  withdrawal_default_note: string | null
}

export interface UpiGenerateResponse {
  upi_url: string
  qr_content: string
  payment_apps: {
    google_pay: string
    phone_pe: string
    paytm: string
    bhim: string
    whatsapp: string
  }
  upi_id: string
  upi_name: string
  amount: number
}

export interface AutoSaveSchedule {
  id: number
  user_id: number
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'salary' | 'custom'
  day_of_week: number | null
  day_of_month: number | null
  time: string | null
  note: string | null
  goal_id: number | null
  active: boolean
  last_triggered: string | null
  next_trigger: string | null
  created_at: string
  updated_at: string
}

export interface AutoSaveInput {
  amount: number
  frequency: string
  day_of_week?: number | null
  day_of_month?: number | null
  time?: string | null
  note?: string | null
  goal_id?: number | null
}

export interface VaultSummary {
  balance: number
  total_deposits: number
  total_withdrawals: number
  today_deposits: number
  weekly_deposits: number
  monthly_deposits: number
  yearly_deposits: number
  current_streak: number
  longest_streak: number
  next_auto_save: AutoSaveSchedule | null
  active_goal: Goal | null
  total_goals: number
  completed_goals: number
  transaction_count: number
}

export interface PredictionData {
  monthly_average: number
  trend_factor: number
  trend: 'increasing' | 'decreasing' | 'stable'
  predicted_months: { month: string; predicted_amount: number }[]
}

export interface ComparisonData {
  this_month: number
  last_month: number
  month_change: number | null
  this_year: number
  last_year: number
  year_change: number | null
  month_comparison_data: { month: string; amount: number }[]
}

export interface HeatmapData {
  year: number
  max_amount: number
  data: Record<string, { amount: number; count: number; intensity: number }>
}

export interface MonthlyReport {
  year: number
  month: number
  total_deposits: number
  total_withdrawals: number
  net_savings: number
  transaction_count: number
  deposit_count: number
  withdrawal_count: number
  daily_breakdown: { date: string; amount: number }[]
  category_breakdown: { category: string; amount: number; count: number }[]
}

export interface BackupData {
  encrypted: boolean
  data: unknown
}

export interface QuickSavePreset {
  id: string
  amount: number
  label: string
  order: number
}

export interface LastSave {
  amount: number
  goalId: number | null
  note: string | null
  paymentApp: string | null
  timestamp: string
}

export interface QuickSaveSession {
  id: string
  amount: number
  goalId: number | null
  note: string | null
  upiUrl: string
  paymentApp: string | null
  startedAt: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'timed_out'
  source: 'quick_save' | 'normal_save'
}

export interface QuickSaveConfig {
  presets: QuickSavePreset[]
  rememberLastAmount: boolean
  rememberLastGoal: boolean
  confirmBeforeLaunch: boolean
  autoOpenPreferredApp: boolean
  confirmationTimeout: number
}

export interface WithdrawPreset {
  id: string
  amount: number
  label: string
  order: number
}

export interface LastWithdraw {
  amount: number
  goalId: number | null
  timestamp: string
}

export interface WithdrawSession {
  id: string
  amount: number
  goalId: number | null
  startedAt: string
  status: 'pending' | 'confirmed' | 'cancelled'
  source: 'quick_withdraw' | 'normal_withdraw'
}

export interface WithdrawConfig {
  presets: WithdrawPreset[]
  rememberLastAmount: boolean
  rememberLastGoal: boolean
  preferredBankingApp: string
  savingsAccountNickname: string
  accountHint: string
  defaultWithdrawReason: string
  autoOpenBankingApp: boolean
  confirmBeforeWithdrawal: boolean
}
