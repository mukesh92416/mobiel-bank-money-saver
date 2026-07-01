import { apiUrl, API_BASE_URL } from '@/config/api'
import { platformService } from '@/services/platformService'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string | number | undefined>
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(apiUrl(`/api${path}`))
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, params } = options

  const url = buildUrl(path, params)
  console.log('[API] Base URL:', API_BASE_URL || '(empty)')
  console.log('[API] Request URL:', url)
  console.log('[API] Platform:', platformService.platform)
  console.log('[API] Method:', method)

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(url, config)
  } catch (err) {
    const message = err instanceof TypeError ? err.message : String(err)
    console.error('[API] Network error:', message)
    console.error('[API] URL:', url)
    console.error('[API] Method:', method)
    if (message === 'Failed to fetch' || message.includes('NetworkError')) {
      throw new ApiError(
        `Network request failed. Check:\n` +
        `1. Backend is running at: ${API_BASE_URL || '(empty)'}\n` +
        `2. Platform ${platformService.platform} has network access\n` +
        `3. CORS allows origin ${window.location.origin}`,
        0,
      )
    }
    throw new ApiError(`Request failed: ${message}`, 0)
  }

  if (!response.ok) {
    if (response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    let errorBody: { error?: string } = {}
    try {
      errorBody = await response.json()
    } catch {
      errorBody = { error: `HTTP ${response.status}: ${response.statusText}` }
    }
    throw new ApiError(errorBody.error || 'Request failed', response.status)
  }

  return response.json()
}

function getBaseUrl(): string {
  const base = apiUrl('')
  return base || window.location.origin
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>(path, { params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, formData: FormData) => {
    const token = localStorage.getItem('access_token')
    return fetch(`${getBaseUrl()}/api${path}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new ApiError(error.error || 'Upload failed', res.status)
      }
      return res.json() as Promise<T>
    })
  },
}

export { ApiError }
