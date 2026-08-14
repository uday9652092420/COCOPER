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
  { code: 'branches', name: 'Branches' },
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
