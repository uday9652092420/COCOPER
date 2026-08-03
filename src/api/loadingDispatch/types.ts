/**
 * @file types.ts
 * @description Type definitions for loading dispatch API (mock implementation).
 */

/**
 * @interface LoadingDispatchItem
 * @description Single line item within a loading dispatch.
 */
export interface LoadingDispatchItem {
  id: string
  itemId?: string
  itemCode?: string
  itemName?: string
  qty: number
  weight: number
  notes?: string
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface LoadingDispatch
 * @description Header record for a loading dispatch, contains embedded items.
 */
export interface LoadingDispatch {
  id: string
  dispatchNo: string
  warehouseId?: string
  warehouseName?: string
  vehicleNo?: string
  driverName?: string
  dispatchDate: string // YYYY-MM-DD
  totalQuantity: number
  totalWeight: number
  status: 'Pending' | 'Dispatched' | 'Delivered' | 'Cancelled'
  remarks?: string
  items: LoadingDispatchItem[]
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface LoadingDispatchCreatePayload
 * @description Payload to create a loading dispatch. id and createdAt are assigned server-side.
 */
export interface LoadingDispatchCreatePayload {
  dispatchNo: string
  warehouseId?: string
  warehouseName?: string
  vehicleNo?: string
  driverName?: string
  dispatchDate?: string
  status?: 'Pending' | 'Dispatched' | 'Delivered' | 'Cancelled'
  remarks?: string
  items?: Array<{
    itemId?: string
    itemCode?: string
    itemName?: string
    qty?: number
    weight?: number
    notes?: string
  }>
}

/**
 * @interface LoadingDispatchUpdatePayload
 * @description Partial payload to update an existing loading dispatch.
 */
export interface LoadingDispatchUpdatePayload {
  id: string
  dispatchNo?: string
  warehouseId?: string
  warehouseName?: string
  vehicleNo?: string
  driverName?: string
  dispatchDate?: string
  status?: 'Pending' | 'Dispatched' | 'Delivered' | 'Cancelled'
  remarks?: string
  items?: Array<{
    id?: string
    itemId?: string
    itemCode?: string
    itemName?: string
    qty?: number
    weight?: number
    notes?: string
  }>
}