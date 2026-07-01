import { AppLauncher } from '@capacitor/app-launcher'
import { platformService } from './platformService'

export async function openUrlNative(url: string): Promise<void> {
  if (platformService.isNative) {
    try {
      const { completed } = await AppLauncher.openUrl({ url })
      if (!completed) {
        console.warn('[AppLauncher] No app could handle the URL:', url)
      }
    } catch (err) {
      console.error('[AppLauncher] Error opening URL:', err)
    }
    return
  }
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
