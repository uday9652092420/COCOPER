/**
 * @file src/api/purchaseInvoice/dataStore.ts
 * @description In-browser async datastore for purchase invoices and items.
 *
 * Implementation:
 * - Persists data to localStorage under key "wc_purchase_invoices_v1".
 * - Exposes async functions: listPurchaseInvoices, getPurchaseInvoice, createPurchaseInvoice, updatePurchaseInvoice, deletePurchaseInvoice.
 * - Seeds initial data when storage is empty.
 */

import type {
  PurchaseInvoice,
  PurchaseInvoiceCreatePayload,
  PurchaseInvoiceUpdatePayload,
  PurchaseInvoiceItem,
} from './types'

const STORAGE_KEY = 'wc_purchase_invoices_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (prefix = 'PI'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default initial records if no persisted data exists.
 */
const seedData = (): PurchaseInvoice[] => [
  {
    id: 'PI-1',
    invoiceNo: 'PI-2026-0001',
    supplierId: 'SUP-1',
    supplierName: 'Global Supplies Co.',
    invoiceDate: nowDate(),
    totalAmount: 50000,
    taxAmount: 4500,
    freightAmount: 200,
    grandTotal: 54700,
    paymentTerm: '30 Days',
    dueDate: nowDate(),
    remarks: 'Sample purchase invoice',
    status: 'Posted',
    items: [
      {
        id: 'PII-1',
        itemId: 'ITM-1',
        itemCode: 'ITM-001',
        itemName: 'Basmati Rice 5kg',
        qty: 20,
        rate: 1000,
        amount: 20000,
        createdAt: nowDate(),
      },
      {
        id: 'PII-2',
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
 * @description Read and parse stored purchase invoices from localStorage. Seeds if empty.
 */
const readStore = (): PurchaseInvoice[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) {
      const s = seedData()
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as PurchaseInvoice[]
  } catch (e) {
    const s = seedData()
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

/**
 * @function writeStore
 * @description Write purchase invoices array to localStorage.
 */
const writeStore = (data: PurchaseInvoice[]) => {
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
const calcTotals = (items: PurchaseInvoiceItem[] = [], taxAmount = 0, freightAmount = 0) => {
  const totalAmount = items.reduce((s, it) => s + Number(it.amount || 0), 0)
  const grandTotal = Number((totalAmount + Number(taxAmount || 0) + Number(freightAmount || 0)).toFixed(2))
  return { totalAmount, grandTotal }
}

/**
 * @function listPurchaseInvoices
 * @description Return all purchase invoices (async simulated).
 */
export const listPurchaseInvoices = async (): Promise<PurchaseInvoice[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(readStore().slice())
    }, 140)
  })
}

/**
 * @function getPurchaseInvoice
 * @description Get a single purchase invoice by id.
 */
export const getPurchaseInvoice = async (id: string): Promise<PurchaseInvoice | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = readStore().find((r) => r.id === id)
      resolve(found)
    }, 100)
  })
}

/**
 * @function createPurchaseInvoice
 * @description Create a new purchase invoice record and persist it. Ensures unique invoiceNo and computes totals.
 */
export const createPurchaseInvoice = async (payload: PurchaseInvoiceCreatePayload): Promise<PurchaseInvoice> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      // Unique invoice_no enforcement
      if (store.some((s) => s.invoiceNo === payload.invoiceNo)) {
        reject(new Error('Invoice number must be unique'))
        return
      }
      // Build items if provided
      const items: PurchaseInvoiceItem[] = (payload.items || []).map((it) => {
        const qty = Number(it.qty ?? 0)
        const rate = Number(it.rate ?? 0)
        return {
          id: generateId('PII'),
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
      const rec: PurchaseInvoice = {
        id: generateId('PI'),
        invoiceNo: payload.invoiceNo,
        supplierId: payload.supplierId ?? '',
        supplierName: payload.supplierName ?? '',
        invoiceDate: payload.invoiceDate ?? nowDate(),
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
 * @function updatePurchaseInvoice
 * @description Update an existing purchase invoice by payload.id. Ensures invoiceNo uniqueness if changing and recomputes totals.
 */
export const updatePurchaseInvoice = async (payload: PurchaseInvoiceUpdatePayload): Promise<PurchaseInvoice> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === payload.id)
      if (idx === -1) {
        reject(new Error('Purchase invoice not found'))
        return
      }
      // Invoice uniqueness check
      if (payload.invoiceNo && store.some((s, i) => i !== idx && s.invoiceNo === payload.invoiceNo)) {
        reject(new Error('Invoice number must be unique'))
        return
      }
      // Merge / rebuild items if provided
      let items = store[idx].items.slice()
      if (payload.items) {
        items = payload.items.map((it) => {
          const qty = Number(it.qty ?? 0)
          const rate = Number(it.rate ?? 0)
          return {
            id: it.id ?? generateId('PII'),
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
      const updated: PurchaseInvoice = {
        ...store[idx],
        invoiceNo: payload.invoiceNo ?? store[idx].invoiceNo,
        supplierId: payload.supplierId ?? store[idx].supplierId,
        supplierName: payload.supplierName ?? store[idx].supplierName,
        invoiceDate: payload.invoiceDate ?? store[idx].invoiceDate,
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
 * @function deletePurchaseInvoice
 * @description Delete a purchase invoice record by id.
 */
export const deletePurchaseInvoice = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Purchase invoice not found'))
        return
      }
      store.splice(idx, 1)
      writeStore(store)
      resolve()
    }, 140)
  })
}