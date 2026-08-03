/**
 * @file dataStore.ts
 * @description In-memory + localStorage backed data store for bag purchases.
 *
 * Provides async functions:
 *  - listBagPurchases
 *  - getBagPurchase
 *  - createBagPurchase
 *  - updateBagPurchase
 *  - deleteBagPurchase
 */

import type { BagPurchase, BagPurchaseCreatePayload, BagPurchaseUpdatePayload, BagPurchaseLine } from './types'

/**
 * @constant STORAGE_KEY
 * @description localStorage key for persistence
 */
const STORAGE_KEY = 'wc_bag_purchases_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a short unique id using timestamp + random suffix.
 */
const generateId = (prefix = 'BP'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default seed records when no persisted data exists.
 */
const seedData = (): BagPurchase[] => [
  {
    id: 'BP1',
    purchaseNo: 'BP-2026-0001',
    supplierId: 'SUP1',
    supplierName: 'ABC Bag Suppliers',
    purchaseDate: nowDate(),
    totalAmount: 45000,
    remarks: 'Sample purchase',
    createdAt: nowDate(),
    lines: [
      { id: 'BPL1', bagTypeId: 'BG1', bagCode: 'BG-50', bharthi: 50, quantity: 100, rate: 150, amount: 15000 },
      { id: 'BPL2', bagTypeId: 'BG2', bagCode: 'BG-25', bharthi: 25, quantity: 200, rate: 150, amount: 30000 },
    ],
  },
]

/**
 * @function readStorage
 * @description Read persisted bag purchases or return seed data.
 */
const readStorage = (): BagPurchase[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as BagPurchase[]
    if (!Array.isArray(parsed)) return seedData()
    return parsed
  } catch {
    return seedData()
  }
}

/**
 * @function writeStorage
 * @description Persist bag purchases to localStorage.
 */
const writeStorage = (data: BagPurchase[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @description Internal cache.
 */
let cache: BagPurchase[] | null = null

/**
 * @function getCache
 * @description Ensure cache initialized and return it.
 */
const getCache = (): BagPurchase[] => {
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
 * @function recalcTotals
 * @description Recalculate line amounts and header total for a purchase.
 */
const recalcTotals = (purchase: BagPurchase) => {
  purchase.lines = purchase.lines.map((ln) => {
    const qty = Number(ln.quantity) || 0
    const rate = Number(ln.rate) || 0
    const amount = Number((qty * rate).toFixed(2))
    return { ...ln, amount }
  })
  purchase.totalAmount = purchase.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
}

/**
 * @function listBagPurchases
 * @description Return all bag purchases (async).
 */
export const listBagPurchases = async (): Promise<BagPurchase[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCache()!.slice())
    }, 120)
  })
}

/**
 * @function getBagPurchase
 * @description Get a single bag purchase by id.
 */
export const getBagPurchase = async (id: string): Promise<BagPurchase | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = getCache()!.find((p) => p.id === id)
      resolve(found)
    }, 80)
  })
}

/**
 * @function createBagPurchase
 * @description Create a new bag purchase record and persist it.
 */
export const createBagPurchase = async (payload: BagPurchaseCreatePayload): Promise<BagPurchase> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      // Ensure purchaseNo uniqueness
      if (current.some((c) => c.purchaseNo === payload.purchaseNo)) {
        reject(new Error('Purchase number must be unique'))
        return
      }

      const lines: BagPurchaseLine[] = (payload.lines || []).map((l) => ({
        id: generateId('BPL'),
        bagTypeId: l.bagTypeId,
        bagCode: (l as any).bagCode ?? '',
        bharthi: (l as any).bharthi ?? 0,
        quantity: Number(l.quantity || 0),
        rate: Number(l.rate || 0),
        amount: 0,
      }))

      const rec: BagPurchase = {
        id: generateId('BP'),
        purchaseNo: payload.purchaseNo,
        supplierId: payload.supplierId ?? '',
        supplierName: payload.supplierName ?? '',
        purchaseDate: payload.purchaseDate ?? nowDate(),
        totalAmount: 0,
        remarks: payload.remarks ?? '',
        createdAt: nowDate(),
        lines,
      }

      recalcTotals(rec)
      current.unshift(rec)
      persist()
      resolve(rec)
    }, 150)
  })
}

/**
 * @function updateBagPurchase
 * @description Update an existing bag purchase by id.
 */
export const updateBagPurchase = async (id: string, payload: BagPurchaseUpdatePayload): Promise<BagPurchase> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Bag purchase not found'))
        return
      }

      const existing = current[idx]

      // If lines provided, replace them (simple approach)
      const lines: BagPurchaseLine[] = payload.lines
        ? payload.lines.map((l) => ({
            id: generateId('BPL'),
            bagTypeId: l.bagTypeId,
            bagCode: (l as any).bagCode ?? '',
            bharthi: (l as any).bharthi ?? 0,
            quantity: Number(l.quantity || 0),
            rate: Number(l.rate || 0),
            amount: 0,
          }))
        : existing.lines

      const updated: BagPurchase = {
        ...existing,
        supplierId: payload.supplierId ?? existing.supplierId,
        supplierName: payload.supplierName ?? existing.supplierName,
        purchaseDate: payload.purchaseDate ?? existing.purchaseDate,
        remarks: payload.remarks ?? existing.remarks,
        lines,
      }

      recalcTotals(updated)
      current[idx] = updated
      persist()
      resolve(updated)
    }, 150)
  })
}

/**
 * @function deleteBagPurchase
 * @description Delete a bag purchase by id.
 */
export const deleteBagPurchase = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Bag purchase not found'))
        return
      }
      current.splice(idx, 1)
      persist()
      resolve()
    }, 120)
  })
}