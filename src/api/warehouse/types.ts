/**
 * @file types.ts
 * @description Type definitions for warehouse API (used by the mock API implementation).
 */

/**
 * @interface Warehouse
 * @description Schema for a warehouse master record.
 */
export interface Warehouse {
  id: string
  code: string
  name: string
  address?: string
  manager?: string
  contactNumber?: string
  status: 'Active' | 'Inactive'
  createdAt: string // ISO date (YYYY-MM-DD)
}

/**
 * @interface WarehouseCreatePayload
 * @description Payload to create a new warehouse.
 */
export interface WarehouseCreatePayload {
  code: string
  name: string
  address?: string
  manager?: string
  contactNumber?: string
  status?: 'Active' | 'Inactive'
}

/**
 * @interface WarehouseUpdatePayload
 * @description Payload to update an existing warehouse.
 */
export interface WarehouseUpdatePayload {
  code?: string
  name?: string
  address?: string
  manager?: string
  contactNumber?: string
  status?: 'Active' | 'Inactive'
}