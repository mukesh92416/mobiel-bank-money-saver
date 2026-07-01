export type PlatformType = 'web' | 'ios' | 'android' | 'desktop'

export interface PlatformInterface {
  getType(): PlatformType
  isNative(): boolean
  isStandalone(): boolean
  getVersion(): string
}

export const platform: PlatformInterface = {
  getType() {
    return 'web'
  },
  isNative() {
    return false
  },
  isStandalone() {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches
  },
  getVersion() {
    return '1.0.0'
  },
}
