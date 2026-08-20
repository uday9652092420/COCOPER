/**
 * @file purchaseInvoice.types.ts
 * @description Type definitions for Purchase Invoice module.
 */

export interface PurchaseInvoiceItem {
  id?: string
  itemId: string
  quantityTons: number
  discount: number
  actualQuantity: number
  purchaseCost: number
  purchaseAmount: number
}

export interface PurchaseInvoiceRow {
  id: string
  invoiceNo: string
  organizationId: string | null
  supplierId: string
  branchId: string
  purchaseOrderId: string | null
  invoiceDate: string
  mode: string
  loadingCost: number
  marketCess: number
  bagsAndSticks: number
  freight: number
  grandTotal: number
  lines: PurchaseInvoiceItem[]
}

export interface PurchaseInvoiceCreateDTO {
  id?: string
  invoiceNo: string
  organizationId?: string | null
  supplierId: string
  branchId?: string
  purchaseOrderId?: string | null
  invoiceDate?: string
  mode?: string
  loadingCost?: number
  marketCess?: number
  bagsAndSticks?: number
  freight?: number
  grandTotal?: number
  lines?: PurchaseInvoiceItem[]
}

export type PurchaseInvoiceUpdateDTO = Partial<PurchaseInvoiceCreateDTO>
