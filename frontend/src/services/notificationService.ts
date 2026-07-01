import { api } from '@/api/client'
import type { Notification } from '@/types'

interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
}

export const notificationService = {
  list: () =>
    api.get<NotificationListResponse>('/notifications'),

  markRead: (id: number) =>
    api.post<{ message: string }>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post<{ message: string }>('/notifications/read-all'),
}
