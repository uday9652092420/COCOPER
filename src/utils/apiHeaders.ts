/**
 * @file apiHeaders.ts
 * @description Helpers to build common API headers.
 */

/**
 * Returns the `x-organization-id` header for the currently selected
 * organization (used by super users to scope org-specific APIs).
 */
export function getOrgHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const organizationId = localStorage.getItem('cocoper_org_id')
  return organizationId ? { 'x-organization-id': organizationId } : {}
}

/**
 * Returns headers identifying the currently logged-in user for
 * profile-scoped APIs (no auth token exists yet).
 */
export function getUserHeaders(
  userId: string,
  userType: 'super' | 'org'
): Record<string, string> {
  return {
    'x-user-id': userId,
    'x-user-type': userType,
  }
}
