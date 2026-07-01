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
