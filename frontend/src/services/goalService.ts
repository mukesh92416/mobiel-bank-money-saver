import { api } from '@/api/client'
import type { Goal, GoalInput } from '@/types'

export const goalService = {
  list: () =>
    api.get<{ goals: Goal[] }>('/goals'),

  get: (id: number) =>
    api.get<{ goal: Goal }>(`/goals/${id}`),

  create: (data: GoalInput) =>
    api.post<{ message: string; goal: Goal }>('/goals', data),

  update: (id: number, data: Partial<GoalInput & { current_amount: number }>) =>
    api.put<{ message: string; goal: Goal }>(`/goals/${id}`, data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/goals/${id}`),
}
