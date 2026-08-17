/**
 * @file usePermissions.ts
 * @description Hook to check the current user's granted permissions.
 */

import { useAuthStore } from '../store/authStore'

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
  const can = (module: string, action: string): boolean =>
    hasPermission(`${module}.${action}`)

  return { user, hasPermission, can }
}

export default usePermissions
