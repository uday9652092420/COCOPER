/**
 * @file dataStore.ts
 * @description In-browser async datastore for customer receipts.
 *
 * Provides async functions:
 *  - listCustomerReceipts
 *  - getCustomerReceipt
 *  - createCustomerReceipt
 *  - updateCustomerReceipt
 *  - deleteCustomerReceipt
 *
 * Persists data to localStorage under key "wc_customer_receipts_v1".
 */

import type { CustomerReceipt, CustomerReceiptCreatePayload, CustomerReceiptUpdatePayload } from './types'

const STORAGE_KEY = 'wc_customer_receipts_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a short unique id using timestamp + random suffix.
 */
const generateId = (prefix = 'CR'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default seed records when no persisted data exists.
 */
const seedData = (): CustomerReceipt[] => [
  {
    id: 'CR-1',
    receiptNo: 'CR-2026-0001',
    customerId: 'CUST-1',
    customerName: 'Apex Traders',
    receiptDate: nowDate(),
    amount: 15000,
    paymentMode: 'Cash',
    referenceNo: '',
    remarks: 'Sample receipt',
    createdAt: nowDate(),
  },
]

/**
 * @function readStorage
 * @description Read persisted receipts or return seed data.
 */
const readStorage = (): CustomerReceipt[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as CustomerReceipt[]
    if (!Array.isArray(parsed)) return seedData()
    return parsed
  } catch {
    return seedData()
  }
}

/**
 * @function writeStorage
 * @description Persist receipts to localStorage.
 */
const writeStorage = (data: CustomerReceipt[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * Internal in-memory cache (initialized lazily).
 */
let cache: CustomerReceipt[] | null = null

/**
 * @function getCache
 * @description Ensure cache initialized and return it.
 */
const getCache = (): CustomerReceipt[] => {
  if (!cache) cache = readStorage()
  return cache
}

/**
 * @function persist
 * @description Persist current cache.
 */
const persist = () => {
  if (cache) writeStorage(cache)
}

/**
 * @function listCustomerReceipts
 * @description Return all customer receipts (async).
 */
export const listCustomerReceipts = async (): Promise<CustomerReceipt[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCache()!.slice())
    }, 140)
  })
}

/**
 * @function getCustomerReceipt
 * @description Get a single customer receipt by id.
 */
export const getCustomerReceipt = async (id: string): Promise<CustomerReceipt | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = getCache()!.find((r) => r.id === id)
      resolve(found)
    }, 100)
  })
}

/**
 * @function createCustomerReceipt
 * @description Create a new customer receipt and persist it.
 */
export const createCustomerReceipt = async (payload: CustomerReceiptCreatePayload): Promise<CustomerReceipt> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      // Ensure receiptNo uniqueness
      if (current.some((c) => c.receiptNo === payload.receiptNo)) {
        reject(new Error('Receipt number must be unique'))
        return
      }
      if (Number(payload.amount) <= 0) {
        reject(new Error('amount must be greater than zero'))
        return
      }
      const rec: CustomerReceipt = {
        id: generateId('CR'),
        receiptNo: payload.receiptNo,
        customerId: payload.customerId ?? '',
        customerName: payload.customerName ?? '',
        receiptDate: payload.receiptDate ?? nowDate(),
        amount: Number(payload.amount),
        paymentMode: (payload.paymentMode as any) ?? 'Cash',
        referenceNo: payload.referenceNo ?? '',
        remarks: payload.remarks ?? '',
        createdAt: nowDate(),
      }
      current.unshift(rec)
      persist()
      resolve(rec)
    }, 180)
  })
}

/**
 * @function updateCustomerReceipt
 * @description Update an existing customer receipt by id.
 */
export const updateCustomerReceipt = async (id: string, payload: CustomerReceiptUpdatePayload): Promise<CustomerReceipt> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Customer receipt not found'))
        return
      }
      if (payload.amount !== undefined && Number(payload.amount) <= 0) {
        reject(new Error('amount must be greater than zero'))
        return
      }
      const updated: CustomerReceipt = {
        ...current[idx],
        customerId: payload.customerId ?? current[idx].customerId,
        customerName: payload.customerName ?? current[idx].customerName,
        receiptDate: payload.receiptDate ?? current[idx].receiptDate,
        amount: payload.amount !== undefined ? Number(payload.amount) : current[idx].amount,
        paymentMode: (payload.paymentMode as any) ?? current[idx].paymentMode,
        referenceNo: payload.referenceNo ?? current[idx].referenceNo,
        remarks: payload.remarks ?? current[idx].remarks,
        createdAt: current[idx].createdAt,
      }
      current[idx] = updated
      persist()
      resolve(updated)
    }, 160)
  })
}

/**
 * @function deleteCustomerReceipt
 * @description Delete a customer receipt by id.
 */
export const deleteCustomerReceipt = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Customer receipt not found'))
        return
      }
      current.splice(idx, 1)
      persist()
      resolve()
    }, 120)
  })
}