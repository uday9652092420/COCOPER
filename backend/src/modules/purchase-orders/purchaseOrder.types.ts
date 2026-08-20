/**
 * @file purchaseOrder.types.ts
 * @description Type definitions for Purchase Order module.
 */

export interface PurchaseOrderItem {
  id?: string
  itemId: string
  quantity: number
  discount: number
  actualQuantity: number
  purchaseCost: number
  purchaseAmount: number
  amount: number
  rate?: number
}

export interface PurchaseOrderRow {
  id: string
  poNumber: string
  organizationId: string | null
  supplierId: string
  branchId: string | null
  warehouseId: string
  date: string
  remarks: string
  status: string
  mode: string
  lines: PurchaseOrderItem[]
}

export interface PurchaseOrderCreateDTO {
  id?: string
  poNumber: string
  organizationId?: string | null
  supplierId: string
  branchId?: string
  warehouseId?: string
  date?: string
  remarks?: string
  status?: string
  mode?: string
  lines?: PurchaseOrderItem[]
}

export type PurchaseOrderUpdateDTO = Partial<PurchaseOrderCreateDTO>
