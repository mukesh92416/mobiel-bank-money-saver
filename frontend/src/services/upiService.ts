import { api } from '@/api/client'
import type { UpiSettings, UpiGenerateResponse } from '@/types'

export const upiService = {
  getSettings: () =>
    api.get<UpiSettings>('/upi/settings'),

  updateSettings: (data: Partial<UpiSettings>) =>
    api.put<{ message: string }>('/upi/settings', data),

  generate: (data: { amount?: number; note?: string; upi_id?: string; upi_name?: string; profile?: 'deposit' | 'withdrawal' }) =>
    api.post<UpiGenerateResponse>('/upi/generate', data),
}
