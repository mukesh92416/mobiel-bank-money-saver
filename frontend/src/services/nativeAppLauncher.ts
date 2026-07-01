import { AppLauncher } from '@capacitor/app-launcher'
import { platformService } from './platformService'

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
  console.log('[AppLauncher] openUrlWithPackage:', { url, packageName })
  if (platformService.isAndroid) {
    try {
      const intentUrl = buildPackageIntentUrl(url, packageName)
      console.log('[AppLauncher] Built intent URL:', intentUrl)
      const { completed } = await AppLauncher.openUrl({ url: intentUrl })
      console.log('[AppLauncher] Package launch result:', { packageName, completed })
      return completed
    } catch (err) {
      console.error('[AppLauncher] Package launch error:', { packageName, error: err })
      return false
    }
  }
  await openUrlNative(url)
  return true
}

function buildPackageIntentUrl(url: string, packageName: string): string {
  const schemeEnd = url.indexOf('://')
  if (schemeEnd === -1) return url
  const scheme = url.slice(0, schemeEnd)
  const rest = url.slice(schemeEnd + 3)
  return `intent://${rest}#Intent;scheme=${scheme};package=${packageName};end`
}
