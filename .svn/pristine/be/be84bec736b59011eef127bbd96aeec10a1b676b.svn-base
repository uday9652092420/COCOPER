/**
 * @file src/api/directSales/dataStore.ts
 * @description In-browser async datastore for direct sales and items.
 *
 * Implementation:
 * - Persists data to localStorage under key "wc_direct_sales_v1".
 * - Exposes async functions: listDirectSales, getDirectSale, createDirectSale, updateDirectSale, deleteDirectSale.
 * - Seeds initial data when storage is empty.
 */

import type { DirectSale, DirectSaleCreatePayload, DirectSaleUpdatePayload, DirectSaleItem } from './types'

const STORAGE_KEY = 'wc_direct_sales_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (prefix = 'DS'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default initial records if no persisted data exists.
 */
const seedData = (): DirectSale[] => [
  {
    id: 'DS-1',
    invoiceNo: 'DS-2026-0001',
    customerId: 'CUST-1',
    customerName: 'Apex Traders',
    saleDate: nowDate(),
    totalAmount: 25000,
    paymentMode: 'Cash',
    referenceNo: '',
    remarks: 'Seed direct sale',
    status: 'Posted',
    items: [
      {
        id: 'DSI-1',
        itemId: 'ITM-1',
        itemCode: 'ITM-001',
        itemName: 'Basmati Rice 5kg',
        qty: 10,
        rate: 1000,
        amount: 10000,
        createdAt: nowDate(),
      },
      {
        id: 'DSI-2',
        itemId: 'ITM-2',
        itemCode: 'ITM-002',
        itemName: 'Broken Rice 10kg',
        qty: 15,
        rate: 1000,
        amount: 15000,
        createdAt: nowDate(),
      },
    ],
    createdAt: nowDate(),
  },
]

/**
 * @function readStore
 * @description Read and parse stored direct sales from localStorage. Seeds if empty.
 */
const readStore = (): DirectSale[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) {
      const s = seedData()
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as DirectSale[]
  } catch (e) {
    const s = seedData()
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

/**
 * @function writeStore
 * @description Write direct sales array to localStorage.
 */
const writeStore = (data: DirectSale[]) => {
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
 * @function calcTotal
 * @description Sum amounts of items to compute totalAmount.
 */
const calcTotal = (items: DirectSaleItem[] = []) => items.reduce((s, it) => s + Number(it.amount || 0), 0)

/**
 * @function listDirectSales
 * @description Return all direct sales (async simulated).
 */
export const listDirectSales = async (): Promise<DirectSale[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(readStore().slice())
    }, 140)
  })
}

/**
 * @function getDirectSale
 * @description Get a single direct sale by id.
 */
export const getDirectSale = async (id: string): Promise<DirectSale | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = readStore().find((r) => r.id === id)
      resolve(found)
    }, 100)
  })
}

/**
 * @function createDirectSale
 * @description Create a new direct sale record and persist it. Ensures unique invoiceNo and computes totals.
 */
export const createDirectSale = async (payload: DirectSaleCreatePayload): Promise<DirectSale> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      // Unique invoice_no enforcement
      if (store.some((s) => s.invoiceNo === payload.invoiceNo)) {
        reject(new Error('Invoice number must be unique'))
        return
      }
      // Build items if provided
      const items: DirectSaleItem[] = (payload.items || []).map((it) => {
        const qty = Number(it.qty ?? 0)
        const rate = Number(it.rate ?? 0)
        return {
          id: generateId('DSI'),
          itemId: it.itemId ?? '',
          itemCode: it.itemCode ?? '',
          itemName: it.itemName ?? '',
          qty,
          rate,
          amount: calcLineAmount(qty, rate),
          createdAt: nowDate(),
        }
      })
      const total = calcTotal(items)
      const rec: DirectSale = {
        id: generateId('DS'),
        invoiceNo: payload.invoiceNo,
        customerId: payload.customerId ?? '',
        customerName: payload.customerName ?? '',
        saleDate: payload.saleDate ?? nowDate(),
        totalAmount: total,
        paymentMode: payload.paymentMode ?? 'Cash',
        referenceNo: payload.referenceNo ?? '',
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
 * @function updateDirectSale
 * @description Update an existing direct sale by id. Ensures invoiceNo uniqueness if changing and recomputes totals.
 */
export const updateDirectSale = async (payload: DirectSaleUpdatePayload): Promise<DirectSale> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === payload.id)
      if (idx === -1) {
        reject(new Error('Direct sale not found'))
        return
      }
      // Invoice uniqueness check
      if (payload.invoiceNo && store.some((s, i) => i !== idx && s.invoiceNo === payload.invoiceNo)) {
        reject(new Error('Invoice number must be unique'))
        return
      }
      // Merge items: if provided, map to stored shape (keep ids if provided)
      let items = store[idx].items.slice()
      if (payload.items) {
        items = payload.items.map((it) => {
          const qty = Number(it.qty ?? 0)
          const rate = Number(it.rate ?? 0)
          return {
            id: it.id ?? generateId('DSI'),
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
      const total = calcTotal(items)
      const updated: DirectSale = {
        ...store[idx],
        invoiceNo: payload.invoiceNo ?? store[idx].invoiceNo,
        customerId: payload.customerId ?? store[idx].customerId,
        customerName: payload.customerName ?? store[idx].customerName,
        saleDate: payload.saleDate ?? store[idx].saleDate,
        paymentMode: payload.paymentMode ?? store[idx].paymentMode,
        referenceNo: payload.referenceNo ?? store[idx].referenceNo,
        remarks: payload.remarks ?? store[idx].remarks,
        status: payload.status ?? store[idx].status,
        items,
        totalAmount: total,
        createdAt: store[idx].createdAt,
      }
      store[idx] = updated
      writeStore(store)
      resolve(updated)
    }, 180)
  })
}

/**
 * @function deleteDirectSale
 * @description Delete a direct sale record by id.
 */
export const deleteDirectSale = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Direct sale not found'))
        return
      }
      store.splice(idx, 1)
      writeStore(store)
      resolve()
    }, 140)
  })
}