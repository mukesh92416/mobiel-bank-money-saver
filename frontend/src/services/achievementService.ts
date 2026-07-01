import { api } from '@/api/client'
import type { Achievement } from '@/types'

export const achievementService = {
  list: () =>
    api.get<{ achievements: Achievement[] }>('/achievements'),
}
