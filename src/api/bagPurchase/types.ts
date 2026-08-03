/**
 * @file types.ts
 * @description Type definitions for Bag Purchase API (used by mock implementation).
 */

/**
 * @interface BagPurchaseLine
 * @description A single line item in a bag purchase.
 */
export interface BagPurchaseLine {
  id: string
  bagTypeId?: string
  bagCode?: string
  bharthi?: number
  quantity: number
  rate: number
  amount: number
}

/**
 * @interface BagPurchase
 * @description Header model for a bag purchase including lines.
 */
export interface BagPurchase {
  id: string
  purchaseNo: string
  supplierId?: string
  supplierName?: string
  purchaseDate: string // YYYY-MM-DD
  totalAmount: number
  remarks?: string
  lines: BagPurchaseLine[]
  createdAt: string
}

/**
 * @interface BagPurchaseCreatePayload
 * @description Payload to create a new bag purchase.
 */
export interface BagPurchaseCreatePayload {
  purchaseNo: string
  supplierId?: string
  supplierName?: string
  purchaseDate?: string
  remarks?: string
  lines?: Omit<BagPurchaseLine, 'id' | 'amount'>[]
}

/**
 * @interface BagPurchaseUpdatePayload
 * @description Payload to update an existing bag purchase.
 */
export interface BagPurchaseUpdatePayload {
  supplierId?: string
  supplierName?: string
  purchaseDate?: string
  remarks?: string
  lines?: Omit<BagPurchaseLine, 'id' | 'amount'>[]
}