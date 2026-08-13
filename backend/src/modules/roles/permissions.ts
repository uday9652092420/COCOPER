/**
 * @file permissions.ts
 * @description Fixed list of permission codes available in the application.
 */

export interface PermissionDef {
  module: string;
  code: string;
  name: string;
}

export const AVAILABLE_PERMISSIONS: PermissionDef[] = [
  { module: 'Dashboard', code: 'dashboard.view', name: 'View Dashboard' },
  { module: 'Organization', code: 'organization.view', name: 'View Organization' },
  { module: 'Organization', code: 'organization.edit', name: 'Edit Organization' },

  { module: 'Masters', code: 'masters.warehouse', name: 'Warehouse Master' },
  { module: 'Masters', code: 'masters.item', name: 'Item Master' },
  { module: 'Masters', code: 'masters.gunnybag', name: 'Gunny Bag Master' },
  { module: 'Masters', code: 'masters.supplier', name: 'Supplier Master' },
  { module: 'Masters', code: 'masters.customer', name: 'Customer Master' },
  { module: 'Masters', code: 'masters.labour', name: 'Labour Master' },
  { module: 'Masters', code: 'masters.bagpurchase', name: 'Bag Purchase Master' },
  { module: 'Masters', code: 'masters.roles', name: 'Roles Master' },
  { module: 'Masters', code: 'masters.users', name: 'User Master' },
  { module: 'Masters', code: 'masters.branches', name: 'Branches Master' },

  { module: 'Transactions', code: 'transactions.purchase-order', name: 'Purchase Order' },
  { module: 'Transactions', code: 'transactions.purchase-invoice', name: 'Purchase Invoice' },
  { module: 'Transactions', code: 'transactions.sales', name: 'Sales' },
  { module: 'Transactions', code: 'transactions.loading-dispatch', name: 'Loading & Dispatch' },
  { module: 'Transactions', code: 'transactions.customer-receipt', name: 'Customer Receipt' },
  { module: 'Transactions', code: 'transactions.supplier-payment', name: 'Supplier Payment' },
  { module: 'Transactions', code: 'transactions.labour-attendance', name: 'Labour Payment' },

  { module: 'Reports', code: 'reports.view', name: 'View Reports' },
];

export const ALL_PERMISSION_CODES: string[] = AVAILABLE_PERMISSIONS.map((p) => p.code);
