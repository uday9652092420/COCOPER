/**
 * @file src/api/purchaseInvoice/types.ts
 * @description TypeScript types and interfaces for purchase invoice API.
 */

/**
 * @interface PurchaseInvoiceItem
 * @description Represents a single line item on a purchase invoice.
 */
export interface PurchaseInvoiceItem {
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
 * @interface PurchaseInvoice
 * @description Header record for a purchase invoice, contains embedded items.
 */
export interface PurchaseInvoice {
  id: string
  invoiceNo: string
  supplierId?: string
  supplierName?: string
  invoiceDate: string // YYYY-MM-DD
  totalAmount: number
  taxAmount: number
  freightAmount: number
  grandTotal: number
  paymentTerm?: string
  dueDate?: string // YYYY-MM-DD
  remarks?: string
  status: 'Draft' | 'Posted' | 'Cancelled'
  items: PurchaseInvoiceItem[]
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface PurchaseInvoiceCreatePayload
 * @description Payload to create a purchase invoice. id and createdAt are assigned server-side.
 */
export interface PurchaseInvoiceCreatePayload {
  invoiceNo: string
  supplierId?: string
  supplierName?: string
  invoiceDate?: string
  taxAmount?: number
  freightAmount?: number
  paymentTerm?: string
  dueDate?: string
  remarks?: string
  status?: 'Draft' | 'Posted' | 'Cancelled'
  items?: Array<{
    itemId?: string
    itemCode?: string
    itemName?: string
    qty?: number
    rate?: number
  }>
}

/**
 * @interface PurchaseInvoiceUpdatePayload
 * @description Partial payload to update an existing purchase invoice. id is required.
 */
export interface PurchaseInvoiceUpdatePayload {
  id: string
  invoiceNo?: string
  supplierId?: string
  supplierName?: string
  invoiceDate?: string
  taxAmount?: number
  freightAmount?: number
  paymentTerm?: string
  dueDate?: string
  remarks?: string
  status?: 'Draft' | 'Posted' | 'Cancelled'
  items?: Array<{
    id?: string
    itemId?: string
    itemCode?: string
    itemName?: string
    qty?: number
    rate?: number
  }>
}