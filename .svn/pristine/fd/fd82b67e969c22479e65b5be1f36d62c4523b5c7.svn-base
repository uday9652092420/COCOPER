/**
 * @file src/api/supplierPayment/dataStore.ts
 * @description In-browser async datastore for supplier payments.
 *
 * Implementation:
 * - Persists data to localStorage under key "wc_supplier_payments_v1".
 * - Exposes async functions: listSupplierPayments, getSupplierPayment, createSupplierPayment,
 *   updateSupplierPayment, deleteSupplierPayment.
 * - Seeds initial data when storage is empty.
 */

import type {
  SupplierPayment,
  SupplierPaymentCreatePayload,
  SupplierPaymentUpdatePayload,
} from './types'

const STORAGE_KEY = 'wc_supplier_payments_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (prefix = 'SP'): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default initial records when no persisted data exists.
 */
const seedData = (): SupplierPayment[] => [
  {
    id: 'SP-1',
    paymentNumber: 'SP-2026-0001',
    supplierId: 'SUP-1',
    supplierName: 'Global Supplies Co.',
    date: nowDate(),
    paymentMode: 'Bank',
    amount: 15000,
    purchaseInvoiceId: 'PI-1',
    remarks: 'Partial payment seed',
    createdAt: nowDate(),
  },
]

/**
 * @function readStore
 * @description Read and parse stored supplier payments from localStorage. Seeds if empty.
 */
const readStore = (): SupplierPayment[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) {
      const s = seedData()
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as SupplierPayment[]
  } catch (e) {
    const s = seedData()
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

/**
 * @function writeStore
 * @description Write supplier payments array to localStorage.
 */
const writeStore = (data: SupplierPayment[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @function listSupplierPayments
 * @description Return all supplier payments (async simulated).
 */
export const listSupplierPayments = async (): Promise<SupplierPayment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(readStore().slice())
    }, 140)
  })
}

/**
 * @function getSupplierPayment
 * @description Get a single supplier payment by id.
 */
export const getSupplierPayment = async (id: string): Promise<SupplierPayment | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = readStore().find((r) => r.id === id)
      resolve(found)
    }, 100)
  })
}

/**
 * @function createSupplierPayment
 * @description Create a new supplier payment record and persist it. Ensures unique paymentNumber.
 */
export const createSupplierPayment = async (
  payload: SupplierPaymentCreatePayload
): Promise<SupplierPayment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      // Validation
      if (!payload.paymentNumber) {
        reject(new Error('paymentNumber is required'))
        return
      }
      if (Number(payload.amount) <= 0) {
        reject(new Error('amount must be greater than zero'))
        return
      }
      if (store.some((s) => s.paymentNumber === payload.paymentNumber)) {
        reject(new Error('Payment number must be unique'))
        return
      }
      const rec: SupplierPayment = {
        id: generateId('SP'),
        paymentNumber: payload.paymentNumber,
        supplierId: payload.supplierId ?? '',
        supplierName: payload.supplierName ?? '',
        date: payload.date ?? nowDate(),
        paymentMode: payload.paymentMode ?? 'Cash',
        amount: Number(payload.amount ?? 0),
        purchaseInvoiceId: payload.purchaseInvoiceId ?? '',
        remarks: payload.remarks ?? '',
        createdAt: nowDate(),
      }
      store.unshift(rec)
      writeStore(store)
      resolve(rec)
    }, 160)
  })
}

/**
 * @function updateSupplierPayment
 * @description Update an existing supplier payment by payload.id. Ensures unique paymentNumber if changing.
 */
export const updateSupplierPayment = async (
  payload: SupplierPaymentUpdatePayload
): Promise<SupplierPayment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === payload.id)
      if (idx === -1) {
        reject(new Error('Supplier payment not found'))
        return
      }
      if (payload.paymentNumber && store.some((s, i) => i !== idx && s.paymentNumber === payload.paymentNumber)) {
        reject(new Error('Payment number must be unique'))
        return
      }
      if (payload.amount !== undefined && Number(payload.amount) <= 0) {
        reject(new Error('amount must be greater than zero'))
        return
      }
      const updated: SupplierPayment = {
        ...store[idx],
        paymentNumber: payload.paymentNumber ?? store[idx].paymentNumber,
        supplierId: payload.supplierId ?? store[idx].supplierId,
        supplierName: payload.supplierName ?? store[idx].supplierName,
        date: payload.date ?? store[idx].date,
        paymentMode: payload.paymentMode ?? store[idx].paymentMode,
        amount: payload.amount !== undefined ? Number(payload.amount) : store[idx].amount,
        purchaseInvoiceId: payload.purchaseInvoiceId ?? store[idx].purchaseInvoiceId,
        remarks: payload.remarks ?? store[idx].remarks,
        createdAt: store[idx].createdAt,
      }
      store[idx] = updated
      writeStore(store)
      resolve(updated)
    }, 160)
  })
}

/**
 * @function deleteSupplierPayment
 * @description Delete a supplier payment record by id.
 */
export const deleteSupplierPayment = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Supplier payment not found'))
        return
      }
      store.splice(idx, 1)
      writeStore(store)
      resolve()
    }, 120)
  })
}