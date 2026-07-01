export async function copyToClipboard(text: string): Promise<boolean> {
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

export function openAppDeepLink(url: string): void {
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function shareContent(data: {
  title: string
  text: string
  url?: string
}): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share(data)
    } catch {
      // user cancelled
    }
  } else {
    const shareText = data.url ? `${data.text}\n${data.url}` : data.text
    await copyToClipboard(shareText)
  }
}
