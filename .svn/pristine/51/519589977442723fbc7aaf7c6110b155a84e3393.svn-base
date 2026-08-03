/**
 * @file types.ts
 * @description Type definitions for Gunny Bag API used by the mock implementation.
 */

/**
 * @interface GunnyBag
 * @description Schema for a gunny bag master record.
 */
export interface GunnyBag {
  id: string
  code: string
  name: string
  size?: string
  ratePerBag: number
  openingStock: number
  status: 'Active' | 'Inactive'
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface GunnyBagCreatePayload
 * @description Payload to create a new gunny bag.
 */
export interface GunnyBagCreatePayload {
  code: string
  name: string
  size?: string
  ratePerBag?: number
  openingStock?: number
  status?: 'Active' | 'Inactive'
}

/**
 * @interface GunnyBagUpdatePayload
 * @description Payload to update an existing gunny bag.
 */
export interface GunnyBagUpdatePayload {
  code?: string
  name?: string
  size?: string
  ratePerBag?: number
  openingStock?: number
  status?: 'Active' | 'Inactive'
}