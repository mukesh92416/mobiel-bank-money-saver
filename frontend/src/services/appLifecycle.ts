type LifecycleEvent = 'pause' | 'resume' | 'backButton' | 'orientationChange'

type LifecycleHandler = (event: LifecycleEvent, data?: unknown) => void

const listeners = new Map<LifecycleEvent, Set<LifecycleHandler>>()

export const appLifecycle = {
  on(event: LifecycleEvent, handler: LifecycleHandler) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(handler)
    return () => listeners.get(event)?.delete(handler)
  },

  emit(event: LifecycleEvent, data?: unknown) {
    listeners.get(event)?.forEach((handler) => handler(event, data))
  },

  setup() {
    if (typeof document === 'undefined') return

    let lastHidden = false
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        lastHidden = true
        this.emit('pause')
      } else if (lastHidden) {
        lastHidden = false
        this.emit('resume')
      }
    })

    document.addEventListener('backbutton', () => {
      this.emit('backButton')
    })

    window.addEventListener('orientationchange', () => {
      this.emit('orientationChange', window.orientation)
    })
  },
}
