import { Capacitor } from '@capacitor/core'

export type Platform = 'web' | 'pwa' | 'android' | 'ios'

class PlatformService {
  private _platform: Platform

  constructor() {
    this._platform = this.detect()
  }

  private detect(): Platform {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform() as Platform
    }
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      return 'pwa'
    }
    return 'web'
  }

  get platform(): Platform {
    return this._platform
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform()
  }

  get isAndroid(): boolean {
    return this._platform === 'android'
  }

  get isIOS(): boolean {
    return this._platform === 'ios'
  }

  get isWeb(): boolean {
    return !Capacitor.isNativePlatform()
  }

  get isPWA(): boolean {
    return this._platform === 'pwa'
  }
}

export const platformService = new PlatformService()
