import { apiUrl } from '@/config/api'

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

  const response = await fetch(buildUrl(path, params), config)

  if (!response.ok) {
    if (response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(error.error || 'Request failed', response.status)
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
