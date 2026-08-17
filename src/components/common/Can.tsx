/**
 * @file Can.tsx
 * @description Renders children only when the user has the required permission.
 */

import type React from 'react'
import { usePermissions } from '../../hooks/usePermissions'

export interface CanProps {
  module: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * @component Can
 * @description Permission-aware render guard.
 */
export const Can: React.FC<CanProps> = ({ module, action, children, fallback = null }) => {
  const { can } = usePermissions()

  return can(module, action) ? <>{children}</> : <>{fallback}</>
}

export default Can
