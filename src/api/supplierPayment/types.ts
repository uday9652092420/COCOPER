/**
 * @file src/api/supplierPayment/types.ts
 * @description Type definitions for Supplier Payment mock API.
 */

/**
 * @interface SupplierPayment
 * @description Single supplier payment record.
 */
export interface SupplierPayment {
  id: string
  paymentNumber: string
  supplierId?: string
  supplierName?: string
  date: string // YYYY-MM-DD
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  amount: number
  purchaseInvoiceId?: string
  remarks?: string
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface SupplierPaymentCreatePayload
 * @description Payload used to create a supplier payment.
 */
export interface SupplierPaymentCreatePayload {
  paymentNumber: string
  supplierId?: string
  supplierName?: string
  date?: string
  paymentMode?: 'Cash' | 'Bank' | 'UPI'
  amount: number
  purchaseInvoiceId?: string
  remarks?: string
}

/**
 * @interface SupplierPaymentUpdatePayload
 * @description Payload used to update an existing supplier payment.
 */
export interface SupplierPaymentUpdatePayload {
  id: string
  paymentNumber?: string
  supplierId?: string
  supplierName?: string
  date?: string
  paymentMode?: 'Cash' | 'Bank' | 'UPI'
  amount?: number
  purchaseInvoiceId?: string
  remarks?: string
}