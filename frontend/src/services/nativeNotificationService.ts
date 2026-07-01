import { LocalNotifications } from '@capacitor/local-notifications'
import { platformService } from './platformService'

export interface NativeNotificationPayload {
  title: string
  body: string
  id?: number
  schedule?: { at: Date }
  extra?: Record<string, string>
}

class NativeNotificationService {
  async requestPermissions(): Promise<boolean> {
    if (!platformService.isNative) return true
    try {
      const { display } = await LocalNotifications.requestPermissions()
      return display === 'granted'
    } catch {
      return false
    }
  }

  async schedule(payload: NativeNotificationPayload): Promise<void> {
    if (platformService.isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: payload.title,
              body: payload.body,
              id: payload.id ?? Date.now(),
              schedule: payload.schedule
                ? { at: payload.schedule.at }
                : undefined,
              extra: payload.extra,
              smallIcon: 'ic_stat_icon_configurable',
              iconColor: '#10b981',
            },
          ],
        })
      } catch (err) {
        console.error('[NativeNotification] Schedule error:', err)
      }
    }
  }

  async cancel(id: number): Promise<void> {
    if (!platformService.isNative) return
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] })
    } catch (err) {
      console.error('[NativeNotification] Cancel error:', err)
    }
  }

  async cancelAll(): Promise<void> {
    if (!platformService.isNative) return
    try {
      const { notifications } = await LocalNotifications.getPending()
      const ids = notifications.map((n) => ({ id: n.id }))
      if (ids.length > 0) {
        await LocalNotifications.cancel({ notifications: ids })
      }
    } catch (err) {
      console.error('[NativeNotification] Cancel all error:', err)
    }
  }

  async getPending(): Promise<number[]> {
    if (!platformService.isNative) return []
    try {
      const { notifications } = await LocalNotifications.getPending()
      return notifications.map((n) => n.id)
    } catch {
      return []
    }
  }
}

export const nativeNotificationService = new NativeNotificationService()
