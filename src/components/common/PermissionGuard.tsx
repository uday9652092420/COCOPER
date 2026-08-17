/**
 * @file PermissionGuard.tsx
 * @description Route guard that redirects users without "read" access
 *              to a module away from that module's pages.
 */

import type React from 'react'
import { Navigate } from 'react-router'
import { usePermissions } from '../../hooks/usePermissions'

export interface PermissionGuardProps {
  module: string
  children: React.ReactNode
}

/**
 * @component PermissionGuard
 * @description Blocks access when the user lacks `<module>.read`.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ module, children }) => {
  const { can } = usePermissions()

  if (!can(module, 'read')) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default PermissionGuard
