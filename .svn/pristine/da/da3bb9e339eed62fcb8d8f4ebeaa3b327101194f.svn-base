/**
 * @file dataStore.ts
 * @description In-browser async datastore for purchase orders and items.
 *
 * Implementation:
 * - Persists data to localStorage under key "wc_purchase_orders_v1".
 * - Exposes async functions: listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder.
 * - Seeds initial data when storage is empty.
 */

import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderUpdatePayload,
  PurchaseOrderItem,
} from './types'

const STORAGE_KEY = 'wc_purchase_orders_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (prefix = 'PO'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default initial records if no persisted data exists.
 */
const seedData = (): PurchaseOrder[] => [
  {
    id: 'PO-1',
    orderNo: 'PO-2026-0001',
    supplierId: 'SUP-1',
    supplierName: 'Global Supplies Co.',
    orderDate: nowDate(),
    totalAmount: 40000,
    taxAmount: 3600,
    freightAmount: 150,
    grandTotal: 43750,
    paymentTerm: '30 Days',
    dueDate: nowDate(),
    remarks: 'Sample purchase order',
    status: 'Confirmed',
    items: [
      {
        id: 'POI-1',
        itemId: 'ITM-1',
        itemCode: 'ITM-001',
        itemName: 'Basmati Rice 5kg',
        qty: 10,
        rate: 1000,
        amount: 10000,
        createdAt: nowDate(),
      },
      {
        id: 'POI-2',
        itemId: 'ITM-2',
        itemCode: 'ITM-002',
        itemName: 'Broken Rice 10kg',
        qty: 30,
        rate: 1000,
        amount: 30000,
        createdAt: nowDate(),
      },
    ],
    createdAt: nowDate(),
  },
]

/**
 * @function readStore
 * @description Read and parse stored purchase orders from localStorage. Seeds if empty.
 */
const readStore = (): PurchaseOrder[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) {
      const s = seedData()
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as PurchaseOrder[]
  } catch (e) {
    const s = seedData()
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

/**
 * @function writeStore
 * @description Write purchase orders array to localStorage.
 */
const writeStore = (data: PurchaseOrder[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @function calcLineAmount
 * @description Calculate amount for a line item.
 */
const calcLineAmount = (qty?: number, rate?: number) => Number((Number(qty || 0) * Number(rate || 0)).toFixed(2))

/**
 * @function calcTotals
 * @description Calculate totals from items, adding tax and freight to compute grandTotal.
 */
const calcTotals = (items: PurchaseOrderItem[] = [], taxAmount = 0, freightAmount = 0) => {
  const totalAmount = items.reduce((s, it) => s + Number(it.amount || 0), 0)
  const grandTotal = Number((totalAmount + Number(taxAmount || 0) + Number(freightAmount || 0)).toFixed(2))
  return { totalAmount, grandTotal }
}

/**
 * @function listPurchaseOrders
 * @description Return all purchase orders (async simulated).
 */
export const listPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(readStore().slice())
    }, 140)
  })
}

/**
 * @function getPurchaseOrder
 * @description Get a single purchase order by id.
 */
export const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = readStore().find((r) => r.id === id)
      resolve(found)
    }, 100)
  })
}

/**
 * @function createPurchaseOrder
 * @description Create a new purchase order record and persist it. Ensures unique orderNo and computes totals.
 */
export const createPurchaseOrder = async (payload: PurchaseOrderCreatePayload): Promise<PurchaseOrder> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      // Unique order_no enforcement
      if (store.some((s) => s.orderNo === payload.orderNo)) {
        reject(new Error('Order number must be unique'))
        return
      }
      // Build items if provided
      const items: PurchaseOrderItem[] = (payload.items || []).map((it) => {
        const qty = Number(it.qty ?? 0)
        const rate = Number(it.rate ?? 0)
        return {
          id: generateId('POI'),
          itemId: it.itemId ?? '',
          itemCode: it.itemCode ?? '',
          itemName: it.itemName ?? '',
          qty,
          rate,
          amount: calcLineAmount(qty, rate),
          createdAt: nowDate(),
        }
      })
      const totals = calcTotals(items, payload.taxAmount ?? 0, payload.freightAmount ?? 0)
      const rec: PurchaseOrder = {
        id: generateId('PO'),
        orderNo: payload.orderNo,
        supplierId: payload.supplierId ?? '',
        supplierName: payload.supplierName ?? '',
        orderDate: payload.orderDate ?? nowDate(),
        totalAmount: totals.totalAmount,
        taxAmount: Number(payload.taxAmount ?? 0),
        freightAmount: Number(payload.freightAmount ?? 0),
        grandTotal: totals.grandTotal,
        paymentTerm: payload.paymentTerm ?? '',
        dueDate: payload.dueDate ?? '',
        remarks: payload.remarks ?? '',
        status: payload.status ?? 'Draft',
        items,
        createdAt: nowDate(),
      }
      store.unshift(rec)
      writeStore(store)
      resolve(rec)
    }, 180)
  })
}

/**
 * @function updatePurchaseOrder
 * @description Update an existing purchase order by payload.id. Ensures orderNo uniqueness if changing and recomputes totals.
 */
export const updatePurchaseOrder = async (payload: PurchaseOrderUpdatePayload): Promise<PurchaseOrder> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === payload.id)
      if (idx === -1) {
        reject(new Error('Purchase order not found'))
        return
      }
      // Order number uniqueness check
      if (payload.orderNo && store.some((s, i) => i !== idx && s.orderNo === payload.orderNo)) {
        reject(new Error('Order number must be unique'))
        return
      }
      // Merge / rebuild items if provided
      let items = store[idx].items.slice()
      if (payload.items) {
        items = payload.items.map((it) => {
          const qty = Number(it.qty ?? 0)
          const rate = Number(it.rate ?? 0)
          return {
            id: it.id ?? generateId('POI'),
            itemId: it.itemId ?? '',
            itemCode: it.itemCode ?? '',
            itemName: it.itemName ?? '',
            qty,
            rate,
            amount: calcLineAmount(qty, rate),
            createdAt: nowDate(),
          }
        })
      }
      const taxAmount = payload.taxAmount !== undefined ? Number(payload.taxAmount) : store[idx].taxAmount
      const freightAmount = payload.freightAmount !== undefined ? Number(payload.freightAmount) : store[idx].freightAmount
      const totals = calcTotals(items, taxAmount, freightAmount)
      const updated: PurchaseOrder = {
        ...store[idx],
        orderNo: payload.orderNo ?? store[idx].orderNo,
        supplierId: payload.supplierId ?? store[idx].supplierId,
        supplierName: payload.supplierName ?? store[idx].supplierName,
        orderDate: payload.orderDate ?? store[idx].orderDate,
        taxAmount,
        freightAmount,
        totalAmount: totals.totalAmount,
        grandTotal: totals.grandTotal,
        paymentTerm: payload.paymentTerm ?? store[idx].paymentTerm,
        dueDate: payload.dueDate ?? store[idx].dueDate,
        remarks: payload.remarks ?? store[idx].remarks,
        status: payload.status ?? store[idx].status,
        items,
        createdAt: store[idx].createdAt,
      }
      store[idx] = updated
      writeStore(store)
      resolve(updated)
    }, 180)
  })
}

/**
 * @function deletePurchaseOrder
 * @description Delete a purchase order record by id.
 */
export const deletePurchaseOrder = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Purchase order not found'))
        return
      }
      store.splice(idx, 1)
      writeStore(store)
      resolve()
    }, 140)
  })
}