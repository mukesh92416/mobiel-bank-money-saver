import { Clipboard } from '@capacitor/clipboard'
import { platformService } from './platformService'

export async function copyToClipboardNative(text: string): Promise<boolean> {
  if (platformService.isNative) {
    try {
      await Clipboard.write({ string: text })
      return true
    } catch {
      return false
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
