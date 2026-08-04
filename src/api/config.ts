const DEFAULT_API_BASE_URL = 'http://localhost:4004/api'

const getConfiguredApiBaseUrl = (): string => {
  const runtimeConfig = (globalThis as typeof globalThis & { __APP_CONFIG__?: { apiBaseUrl?: string } }).__APP_CONFIG__
  return runtimeConfig?.apiBaseUrl || DEFAULT_API_BASE_URL
}

export const API_BASE_URL = getConfiguredApiBaseUrl()

export const buildApiUrl = (path: string): string => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
