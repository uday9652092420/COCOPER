/**
 * @file types.ts
 * @description Type definitions for item API (used by the mock API implementation).
 */

/**
 * @interface Item
 * @description Schema for an item master record.
 */
export interface Item {
  id: string
  code: string
  name: string
  category?: string
  uom?: string
  status: 'Active' | 'Inactive'
  createdAt: string // ISO date (YYYY-MM-DD)
}

/**
 * @interface ItemCreatePayload
 * @description Payload to create a new item.
 */
export interface ItemCreatePayload {
  code: string
  name: string
  category?: string
  uom?: string
  status?: 'Active' | 'Inactive'
}

/**
 * @interface ItemUpdatePayload
 * @description Payload to update an existing item.
 */
export interface ItemUpdatePayload {
  code?: string
  name?: string
  category?: string
  uom?: string
  status?: 'Active' | 'Inactive'
}