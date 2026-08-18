/**
 * @file permissions.ts
 * @description Fixed list of modules and actions for per-user permissions.
 */

export interface PermissionModule {
  code: string;
  name: string;
}

export interface PermissionAction {
  code: string;
  name: string;
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { code: 'dashboard', name: 'Dashboard' },
  { code: 'organization', name: 'Organization' },
  { code: 'warehouse', name: 'Warehouse' },
  { code: 'item', name: 'Item' },
  { code: 'gunnybag', name: 'Gunny Bag' },
  { code: 'supplier', name: 'Supplier' },
  { code: 'customer', name: 'Customer' },
  { code: 'labour', name: 'Labour' },
  { code: 'bagpurchase', name: 'Bag Purchase' },
  { code: 'roles', name: 'Roles' },
  { code: 'users', name: 'Users' },
  { code: 'user-permission', name: 'User Permission' },
  { code: 'branches', name: 'Branches' },
  { code: 'branch-master', name: 'Branch Master' },
  { code: 'purchase-order', name: 'Purchase Order' },
  { code: 'purchase-invoice', name: 'Purchase Invoice' },
  { code: 'sales', name: 'Sales' },
  { code: 'loading-dispatch', name: 'Loading & Dispatch' },
  { code: 'customer-receipt', name: 'Customer Receipt' },
  { code: 'supplier-payment', name: 'Supplier Payment' },
  { code: 'labour-attendance', name: 'Labour Payment' },
  { code: 'reports', name: 'Reports' },
];

export const PERMISSION_ACTIONS: PermissionAction[] = [
  { code: 'read', name: 'Read' },
  { code: 'create', name: 'Create' },
  { code: 'edit', name: 'Edit' },
  { code: 'delete', name: 'Delete' },
  { code: 'approve', name: 'Approve' },
];

export function buildPermissionCode(moduleCode: string, actionCode: string): string {
  return `${moduleCode}.${actionCode}`;
}

/**
 * All possible permission codes (every module x every action).
 * Used to grant full permissions to newly created users by default.
 */
export function getAllPermissionCodes(): string[] {
  const codes: string[] = [];

  for (const module of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      codes.push(buildPermissionCode(module.code, action.code));
    }
  }

  return codes;
}
