/**
 * @file src/api/directSales/types.ts
 * @description Type definitions for Direct Sales mock API.
 */

/**
 * @interface DirectSaleItem
 * @description Single line item within a direct sale.
 */
export interface DirectSaleItem {
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
 * @interface DirectSale
 * @description Header record for a direct sale, contains embedded items.
 */
export interface DirectSale {
  id: string
  invoiceNo: string
  customerId?: string
  customerName?: string
  saleDate: string // YYYY-MM-DD
  totalAmount: number
  paymentMode?: 'Cash' | 'Cheque' | 'Online' | 'Credit'
  referenceNo?: string
  remarks?: string
  status: 'Draft' | 'Posted' | 'Cancelled'
  items: DirectSaleItem[]
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface DirectSaleCreatePayload
 * @description Payload to create a direct sale. id and createdAt are assigned server-side.
 */
export interface DirectSaleCreatePayload {
  invoiceNo: string
  customerId?: string
  customerName?: string
  saleDate?: string
  paymentMode?: 'Cash' | 'Cheque' | 'Online' | 'Credit'
  referenceNo?: string
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
 * @interface DirectSaleUpdatePayload
 * @description Partial payload to update an existing direct sale.
 */
export interface DirectSaleUpdatePayload {
  id: string
  invoiceNo?: string
  customerId?: string
  customerName?: string
  saleDate?: string
  paymentMode?: 'Cash' | 'Cheque' | 'Online' | 'Credit'
  referenceNo?: string
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