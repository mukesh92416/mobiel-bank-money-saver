import { AppLauncher } from '@capacitor/app-launcher'
import { Capacitor } from '@capacitor/core'
import { platformService } from './platformService'
import { UPIIntentLauncher } from '@/plugins/upi-intent-launcher'

function logPlatform(): string {
  const p = Capacitor.getPlatform()
  const native = Capacitor.isNativePlatform()
  const platform = `platform=${p}, isNative=${native}, userAgent=${navigator?.userAgent?.slice?.(0, 80) ?? 'unknown'}`
  console.log('[AppLauncher] Platform detection:', platform)
  return platform
}

export async function openUrlNative(url: string): Promise<void> {
  const plat = logPlatform()
  console.log('[AppLauncher] openUrlNative URL:', url)
  if (platformService.isNative) {
    try {
      const { completed } = await AppLauncher.openUrl({ url })
      console.log('[AppLauncher] openUrlNative result:', { url, completed, plat })
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
  const plat = logPlatform()
  console.log('[AppLauncher] openUrlWithPackage:', { url, packageName, platform: platformService.platform, plat })
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
  console.log('[AppLauncher] Not Android, falling back to openUrlNative')
  await openUrlNative(url)
  return true
}
