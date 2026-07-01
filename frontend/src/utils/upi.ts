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
    throw new Error('Invalid UPI URI. Must start with upi://pay')
  }

  const queryStart = trimmed.indexOf('?')
  if (queryStart === -1) {
    throw new Error('Invalid UPI URI. No query parameters found.')
  }

  const query = trimmed.slice(queryStart + 1)
  const params = new URLSearchParams(query)

  const pa = params.get('pa')
  if (!pa) {
    throw new Error('Missing required parameter: pa (Payee VPA)')
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
  console.log('[UPI] openAppDeepLink:', { url, packageName })
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
