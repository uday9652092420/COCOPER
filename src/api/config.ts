import { getAPIBaseUrl } from '../config/api'

/**
 * API base URL used by the fetch handlers under src/api.
 * Resolution logic lives in src/config/api.ts (runtime override,
 * then .env VITE_BASE_API_URL, then hostname, then local default).
 */
export const API_BASE_URL = getAPIBaseUrl()

export const buildApiUrl = (path: string): string => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
