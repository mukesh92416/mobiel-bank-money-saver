import { Share } from '@capacitor/share'
import { platformService } from './platformService'
import { copyToClipboardNative } from './nativeClipboard'

export async function shareNative(data: {
  title?: string
  text: string
  url?: string
}): Promise<void> {
  if (platformService.isNative) {
    try {
      await Share.share({
        title: data.title,
        text: data.text,
        url: data.url,
      })
    } catch {
      // user cancelled
    }
    return
  }
  if (navigator.share) {
    try {
      await navigator.share(data)
    } catch {
      // user cancelled
    }
  } else {
    const shareText = data.url ? `${data.text}\n${data.url}` : data.text
    await copyToClipboardNative(shareText)
  }
}
