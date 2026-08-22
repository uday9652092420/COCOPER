/**
 * @file salesOrder.types.ts
 * @description Type definitions for Sales Order module.
 */

export interface SalesOrderItem {
  id?: string
  itemId: string
  quantity: number
  discount: number
  actualQuantity: number
  saleCost: number
  saleAmount: number
  amount: number
}

export interface SalesOrderRow {
  id: string
  soNumber: string
  organizationId: string | null
  customerId: string
  date: string
  remarks: string
  sourcePOId: string
  poNumber: string
  mode: string
  status: "Draft" | "Approved"
  salesInvoiceStatus: boolean
  totalAmount: number
  lines: SalesOrderItem[]
}

export interface SalesOrderCreateDTO {
  id?: string
  soNumber: string
  organizationId?: string | null
  customerId?: string
  date?: string
  remarks?: string
  sourcePOId?: string
  poNumber?: string
  mode?: string
  status?: "Draft" | "Approved"
  salesInvoiceStatus?: boolean
  totalAmount?: number
  lines?: SalesOrderItem[]
}

export type SalesOrderUpdateDTO = Partial<SalesOrderCreateDTO>
