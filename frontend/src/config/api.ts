export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function apiUrl(path: string): string {
  const base = API_BASE_URL
  if (base) {
    return `${base}${path}`
  }
  return path
}
