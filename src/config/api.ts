/**
 * API Configuration
 * ------------------
 * Single place that controls the backend API base URL.
 *
 * Resolution order (first match wins):
 *   1. Runtime override: window.__APP_CONFIG__.apiBaseUrl (set by a
 *      <script> on the server, if present).
 *   2. Build-time: import.meta.env.VITE_BASE_API_URL injected from the
 *      root .env by scripts/build.mjs. To switch environment, comment /
 *      uncomment the matching block in .env, then rebuild.
 *   3. Hostname detection: uncomment a block below to enable auto
 *      switching when the same build is served from that host.
 *   4. Default: local development.
 */

function getRuntimeApiUrl(): string {
  if (typeof window === 'undefined') return ''
  const runtimeConfig = (
    globalThis as typeof globalThis & { __APP_CONFIG__?: { apiBaseUrl?: string } }
  ).__APP_CONFIG__
  return runtimeConfig?.apiBaseUrl || ''
}

function getBuildTimeApiUrl(): string {
  try {
    // Replaced at build time by esbuild `define` (see scripts/build.mjs).
    return import.meta.env.VITE_BASE_API_URL || ''
  } catch {
    return ''
  }
}

function getHostnameApiUrl(): string {
  if (typeof window === 'undefined') return ''
  const hostname = window.location.hostname

//   // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4004/api'
  }

  // TESTING SERVER (R & D) - uncomment to enable auto detection
//   if (hostname === '192.168.1.230') {
//     return 'http://192.168.1.230:3003/api'
//   }

  // LIVE / PRODUCTION SERVER - uncomment to enable auto detection
  // if (hostname === '<live-server-ip>') {
  //   return 'http://<live-server-ip>:3000/api'
  // }

  return ''
}

export function getAPIBaseUrl(): string {
  return (
    getRuntimeApiUrl() ||
    getBuildTimeApiUrl() ||
    getHostnameApiUrl() ||
    'http://localhost:4004/api'
  )
}

/**
 * Base API URL used by services (includes the /api prefix).
 */
export const API = getAPIBaseUrl()

export default API
