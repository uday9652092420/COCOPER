/**
 * @file scopeEvents.ts
 * @description Lightweight event bus that notifies open pages when the
 *              organization / branch scope changes in the header.
 */

export const SCOPE_CHANGE_EVENT = 'cocoper-scope-change'

/**
 * Dispatch a scope-change event (organization or branch switched).
 */
export function notifyScopeChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(SCOPE_CHANGE_EVENT))
}

/**
 * Subscribe to scope-change events. Returns an unsubscribe function.
 */
export function onScopeChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(SCOPE_CHANGE_EVENT, callback)
  return () => window.removeEventListener(SCOPE_CHANGE_EVENT, callback)
}
