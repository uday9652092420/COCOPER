/**
 * @file usePermissions.ts
 * @description Hook to check the current user's granted permissions.
 */

import { useAuthStore } from '../store/authStore'

/**
 * @description Report modules that were previously gated by a single legacy
 * `reports.read` permission (before reports were split into per-report modules).
 * Existing users may only have the old `reports.read` code, so it is treated as
 * granting read access to ALL report modules (backward compatible with the
 * previous single "reports" permission).
 */
const REPORT_MODULES = [
  'purchase-register',
  'sales-register',
  'supplier-statement',
  'customer-statement',
  'labour-attendance-report',
  'pending-dispatch',
  'outstanding',
]

export function usePermissions() {
  const user = useAuthStore((state) => state.user)

  /**
   * Whether the user has the given permission code, e.g. "item.create".
   */
  const hasPermission = (code: string): boolean => {
    if (!user) return false
    if (user.isSuperAdmin) return true
    return Array.isArray(user.permissions) && user.permissions.includes(code)
  }

  /**
   * Whether the user can perform `<action>` on `<module>`, e.g. can("item", "edit").
   */
  const can = (module: string, action: string): boolean => {
    if (hasPermission(`${module}.${action}`)) return true
    // Legacy compatibility: the old `reports.read` permission grants read access to
    // every report module (restores the previous single "reports" gate behavior).
    if (action === 'read' && REPORT_MODULES.includes(module) && hasPermission('reports.read')) return true
    return false
  }

  return { user, hasPermission, can }
}

export default usePermissions
