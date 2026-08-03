/**
 * @file types.ts
 * @description Type definitions for Purchase Order API (mock implementation).
 */

/**
 * @interface PurchaseOrderItem
 * @description Represents a single line item on a purchase order.
 */
export interface PurchaseOrderItem {
  id: string
  itemId?: string
  itemCode?: string
  itemName?: string
  qty: number
  rate: number
  amount: number
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface PurchaseOrder
 * @description Header record for a purchase order, contains embedded items.
 */
export interface PurchaseOrder {
  id: string
  orderNo: string
  supplierId?: string
  supplierName?: string
  orderDate: string // YYYY-MM-DD
  totalAmount: number
  taxAmount: number
  freightAmount: number
  grandTotal: number
  paymentTerm?: string
  dueDate?: string // YYYY-MM-DD
  remarks?: string
  status: 'Draft' | 'Confirmed' | 'Cancelled'
  items: PurchaseOrderItem[]
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface PurchaseOrderCreatePayload
 * @description Payload to create a purchase order. id and createdAt are assigned server-side.
 */
export interface PurchaseOrderCreatePayload {
  orderNo: string
  supplierId?: string
  supplierName?: string
  orderDate?: string
  taxAmount?: number
  freightAmount?: number
  paymentTerm?: string
  dueDate?: string
  remarks?: string
  status?: 'Draft' | 'Confirmed' | 'Cancelled'
  items?: Array<{
    itemId?: string
    itemCode?: string
    itemName?: string
    qty?: number
    rate?: number
  }>
}

/**
 * @interface PurchaseOrderUpdatePayload
 * @description Partial payload to update an existing purchase order. id is required.
 */
export interface PurchaseOrderUpdatePayload {
  id: string
  orderNo?: string
  supplierId?: string
  supplierName?: string
  orderDate?: string
  taxAmount?: number
  freightAmount?: number
  paymentTerm?: string
  dueDate?: string
  remarks?: string
  status?: 'Draft' | 'Confirmed' | 'Cancelled'
  items?: Array<{
    id?: string
    itemId?: string
    itemCode?: string
    itemName?: string
    qty?: number
    rate?: number
  }>
}