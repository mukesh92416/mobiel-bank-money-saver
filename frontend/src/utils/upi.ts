import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { copyToClipboardNative } from '@/services/nativeClipboard'
import { shareNative } from '@/services/nativeShare'
import { openUrlNative, openUrlWithPackage } from '@/services/nativeAppLauncher'

export const UPI_APP_PACKAGES: Record<string, string | null> = {
  google_pay: 'com.google.android.apps.nbu.paisa.user',
  phone_pe: 'com.phonepe.app',
  paytm: 'net.one97.paytm',
  bhim: 'in.org.npci.upiapp',
  whatsapp: null,
}

export interface ParsedUpiUri {
  pa: string
  pn: string | null
  tn: string | null
  cu: string | null
  am: string | null
}

export function parseUpiUri(uri: string): ParsedUpiUri {
  const trimmed = uri.trim()
  if (!trimmed.toLowerCase().startsWith('upi://pay')) {
    throw new Error('This is not a valid UPI QR code.')
  }

  const queryStart = trimmed.indexOf('?')
  if (queryStart === -1) {
    throw new Error('This is not a valid UPI QR code.')
  }

  const query = trimmed.slice(queryStart + 1)
  const params = new URLSearchParams(query)

  const pa = params.get('pa')
  if (!pa) {
    throw new Error('This is not a valid UPI QR code.')
  }

  return {
    pa,
    pn: params.get('pn'),
    tn: params.get('tn'),
    cu: params.get('cu'),
    am: params.get('am'),
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  return copyToClipboardNative(text)
}

export async function openAppDeepLink(url: string, packageName?: string): Promise<boolean> {
  const platform = Capacitor.getPlatform()
  const isNative = Capacitor.isNativePlatform()
  console.log('[UPI] openAppDeepLink:', { url, packageName, platform, isNative })
  if (packageName) {
    const completed = await openUrlWithPackage(url, packageName)
    console.log('[UPI] Package launch completed:', completed)
    if (!completed) {
      console.log('[UPI] Package not available, falling back to chooser:', packageName)
      await openUrlNative(url)
      return false
    }
    return true
  }
  await openUrlNative(url)
  return true
}

export async function shareContent(data: {
  title: string
  text: string
  url?: string
}): Promise<void> {
  await shareNative(data)
}

export async function downloadQRCode(dataUrl: string): Promise<void> {
  const isNative = Capacitor.isNativePlatform()
  const platform = Capacitor.getPlatform()
  console.log('[QR] downloadQRCode:', { platform, isNative })

  if (isNative) {
    try {
      const base64 = dataUrl.split(',')[1]
      if (!base64) {
        console.error('[QR] Invalid data URL format')
        return
      }
      const filename = `MoneyVault-UPI-QR-${Date.now()}.png`
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      })
      console.log('[QR] File written:', result.uri)

      await Share.share({
        title: 'Money Vault UPI QR',
        text: 'UPI Payment QR Code',
        url: result.uri,
      })
      console.log('[QR] Share sheet opened for:', result.uri)
    } catch (err) {
      console.error('[QR] Native download failed, falling back to web download:', err)
      downloadQRWeb(dataUrl)
    }
  } else {
    downloadQRWeb(dataUrl)
  }
}

function downloadQRWeb(dataUrl: string): void {
  try {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `MoneyVault-UPI-QR-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    console.log('[QR] Web download triggered')
  } catch (err) {
    console.error('[QR] Web download failed:', err)
  }
}
