import { api } from '@/api/client'
import type { AutoSaveSchedule, AutoSaveInput } from '@/types'

export const autoSaveService = {
  list: () =>
    api.get<{ schedules: AutoSaveSchedule[] }>('/auto-save/schedules'),

  create: (data: AutoSaveInput) =>
    api.post<{ message: string; schedule: AutoSaveSchedule }>('/auto-save/schedules', data),

  update: (id: number, data: Partial<AutoSaveInput & { active: boolean }>) =>
    api.put<{ message: string; schedule: AutoSaveSchedule }>(`/auto-save/schedules/${id}`, data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/auto-save/schedules/${id}`),

  getNext: () =>
    api.get<{ next: AutoSaveSchedule | null }>('/auto-save/next'),
}
