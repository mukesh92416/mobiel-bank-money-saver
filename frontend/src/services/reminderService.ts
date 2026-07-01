import { api } from '@/api/client'
import type { AppSettings } from '@/types'

export type ReminderFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom'
export type ReminderSettings = Pick<AppSettings,
  | 'reminder_enabled'
  | 'reminder_time'
  | 'reminder_frequency'
  | 'reminder_days'
  | 'reminder_amount'
  | 'reminder_title'
  | 'reminder_message'
  | 'reminder_timezone'
>

export const reminderService = {
  async getReminderSettings(): Promise<ReminderSettings> {
    const res = await api.get<{ settings: AppSettings }>('/settings')
    const s = res.settings
    return {
      reminder_enabled: s.reminder_enabled,
      reminder_time: s.reminder_time,
      reminder_frequency: s.reminder_frequency,
      reminder_days: s.reminder_days,
      reminder_amount: s.reminder_amount,
      reminder_title: s.reminder_title,
      reminder_message: s.reminder_message,
      reminder_timezone: s.reminder_timezone,
    }
  },

  async saveReminderSettings(data: Partial<ReminderSettings>): Promise<ReminderSettings> {
    const res = await api.put<{ settings: AppSettings }>('/settings', data)
    const s = res.settings
    return {
      reminder_enabled: s.reminder_enabled,
      reminder_time: s.reminder_time,
      reminder_frequency: s.reminder_frequency,
      reminder_days: s.reminder_days,
      reminder_amount: s.reminder_amount,
      reminder_title: s.reminder_title,
      reminder_message: s.reminder_message,
      reminder_timezone: s.reminder_timezone,
    }
  },

  shouldSendReminder(): boolean {
    return false
  },

  hasSavedToday(): boolean {
    return false
  },

  markReminderSent(): void {
    return
  },
}
