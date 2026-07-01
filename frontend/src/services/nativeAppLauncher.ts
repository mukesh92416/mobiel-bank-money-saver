import { AppLauncher } from '@capacitor/app-launcher'
import { platformService } from './platformService'
import { UPIIntentLauncher } from '@/plugins/upi-intent-launcher'

export async function openUrlNative(url: string): Promise<void> {
  if (platformService.isNative) {
    try {
      const { completed } = await AppLauncher.openUrl({ url })
      console.log('[AppLauncher] openUrlNative result:', { url, completed })
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

export async function openUrlWithPackage(url: string, packageName: string): Promise<boolean> {
  console.log('[AppLauncher] openUrlWithPackage:', { url, packageName, platform: platformService.platform })
  if (platformService.isAndroid) {
    try {
      await UPIIntentLauncher.launch({ packageName, upiUri: url })
      console.log('[AppLauncher] Package launch succeeded:', packageName)
      return true
    } catch (err) {
      console.log('[AppLauncher] Package launch failed, needs fallback:', packageName, err)
      return false
    }
  }
  await openUrlNative(url)
  return true
}
