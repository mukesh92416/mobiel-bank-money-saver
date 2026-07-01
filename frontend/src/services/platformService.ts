import type { PlatformInterface, PlatformType } from '@/services/interfaces/platform'

function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'web'
  const ua = navigator.userAgent || ''
  if (/android/i.test(ua) && /wv/.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/macintosh|windows/i.test(ua) && !('ontouchend' in document)) return 'desktop'
  return 'web'
}

function detectCapacitor(): boolean {
  return typeof (window as any)?.Capacitor !== 'undefined'
}

export const platformService: PlatformInterface = {
  getType(): PlatformType {
    if (detectCapacitor()) {
      const cap = (window as any).Capacitor
      const platform = cap?.getPlatform?.() || 'web'
      if (platform === 'android') return 'android'
      if (platform === 'ios') return 'ios'
    }
    return detectPlatform()
  },

  isNative(): boolean {
    return detectCapacitor() || this.getType() === 'android' || this.getType() === 'ios'
  },

  isStandalone(): boolean {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )
  },

  getVersion(): string {
    return '1.0.0'
  },
}
