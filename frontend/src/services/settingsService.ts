import { api } from '@/api/client'
import type { AppSettings } from '@/types'

export const settingsService = {
  get: () =>
    api.get<{ settings: AppSettings }>('/settings'),

  update: (data: Partial<AppSettings>) =>
    api.put<{ message: string; settings: AppSettings }>('/settings', data),

  backup: () =>
    api.get<BlobPart>('/settings/backup', {}).then(() =>
      api.get<{ data: string }>('/settings/backup'),
    ),

  restore: (data: unknown) =>
    api.post<{ message: string }>('/settings/restore', data),

  reset: () =>
    api.post<{ message: string }>('/settings/reset'),

  deleteAccount: () =>
    api.delete<{ message: string }>('/auth/profile'),
}
