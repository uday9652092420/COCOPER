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
  return {
    ...(organizationId ? { 'x-organization-id': organizationId } : {}),
    ...getAuthHeader(),
  }
}

export function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('cocoper_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Returns the `x-branch-id` header for the currently selected branch.
 * Used to scope branch-specific master modules (items, gunny bags,
 * bag purchase) in addition to the organization scope.
 */
export function getBranchHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const branchId = localStorage.getItem('cocoper_branch_id')
  return branchId ? { 'x-branch-id': branchId } : {}
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
    ...getAuthHeader(),
  }
}
