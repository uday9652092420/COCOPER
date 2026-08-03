/**
 * @file dataStore.ts
 * @description In-browser async datastore for loading dispatches and items.
 *
 * Implementation:
 * - Persists data to localStorage under key "wc_loading_dispatch_v1".
 * - Exposes async functions: listLoadingDispatches, getLoadingDispatch, createLoadingDispatch, updateLoadingDispatch, deleteLoadingDispatch.
 * - Seeds initial data when storage is empty.
 */

import type {
  LoadingDispatch,
  LoadingDispatchCreatePayload,
  LoadingDispatchUpdatePayload,
  LoadingDispatchItem,
} from './types'

const STORAGE_KEY = 'wc_loading_dispatch_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (prefix = 'LD'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default initial records when no persisted data exists.
 */
const seedData = (): LoadingDispatch[] => [
  {
    id: 'LD-1',
    dispatchNo: 'LD-2026-0001',
    warehouseId: 'WH-1',
    warehouseName: 'Central Warehouse',
    vehicleNo: 'TN-01-AB-1234',
    driverName: 'Ramesh',
    dispatchDate: nowDate(),
    totalQuantity: 100,
    totalWeight: 1250.5,
    status: 'Dispatched',
    remarks: 'Seeded dispatch',
    items: [
      {
        id: 'LDI-1',
        itemId: 'ITM-001',
        itemCode: 'ITM-001',
        itemName: 'Basmati Rice 5kg',
        qty: 50,
        weight: 625.25,
        notes: '',
        createdAt: nowDate(),
      },
      {
        id: 'LDI-2',
        itemId: 'ITM-002',
        itemCode: 'ITM-002',
        itemName: 'Broken Rice 10kg',
        qty: 50,
        weight: 625.25,
        notes: '',
        createdAt: nowDate(),
      },
    ],
    createdAt: nowDate(),
  },
]

/**
 * @function readStore
 * @description Read and parse stored dispatches from localStorage. Seeds if empty.
 */
const readStore = (): LoadingDispatch[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) {
      const s = seedData()
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as LoadingDispatch[]
  } catch (e) {
    const s = seedData()
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

/**
 * @function writeStore
 * @description Write dispatches array to localStorage.
 */
const writeStore = (data: LoadingDispatch[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @function calcTotals
 * @description Calculate total quantity and weight from items.
 */
const calcTotals = (items: LoadingDispatchItem[] = []) => {
  const totalQuantity = items.reduce((s, it) => s + Number(it.qty || 0), 0)
  const totalWeight = items.reduce((s, it) => s + Number(it.weight || 0), 0)
  return { totalQuantity, totalWeight }
}

/**
 * @function listLoadingDispatches
 * @description Return all loading dispatches (async simulated).
 */
export const listLoadingDispatches = async (): Promise<LoadingDispatch[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(readStore().slice())
    }, 160)
  })
}

/**
 * @function getLoadingDispatch
 * @description Get a single loading dispatch by id.
 */
export const getLoadingDispatch = async (id: string): Promise<LoadingDispatch | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = readStore().find((r) => r.id === id)
      resolve(found)
    }, 120)
  })
}

/**
 * @function createLoadingDispatch
 * @description Create a new loading dispatch record and persist it. Ensures unique dispatchNo and computes totals.
 */
export const createLoadingDispatch = async (payload: LoadingDispatchCreatePayload): Promise<LoadingDispatch> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      if (store.some((s) => s.dispatchNo === payload.dispatchNo)) {
        reject(new Error('Dispatch number must be unique'))
        return
      }
      const items: LoadingDispatchItem[] = (payload.items || []).map((it) => {
        return {
          id: generateId('LDI'),
          itemId: it.itemId ?? '',
          itemCode: it.itemCode ?? '',
          itemName: it.itemName ?? '',
          qty: Number(it.qty ?? 0),
          weight: Number(it.weight ?? 0),
          notes: it.notes ?? '',
          createdAt: nowDate(),
        }
      })
      const totals = calcTotals(items)
      const rec: LoadingDispatch = {
        id: generateId('LD'),
        dispatchNo: payload.dispatchNo,
        warehouseId: payload.warehouseId ?? '',
        warehouseName: payload.warehouseName ?? '',
        vehicleNo: payload.vehicleNo ?? '',
        driverName: payload.driverName ?? '',
        dispatchDate: payload.dispatchDate ?? nowDate(),
        totalQuantity: totals.totalQuantity,
        totalWeight: totals.totalWeight,
        status: payload.status ?? 'Pending',
        remarks: payload.remarks ?? '',
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
 * @function updateLoadingDispatch
 * @description Update an existing loading dispatch by payload.id. Ensures dispatchNo uniqueness if changing and recomputes totals.
 */
export const updateLoadingDispatch = async (payload: LoadingDispatchUpdatePayload): Promise<LoadingDispatch> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === payload.id)
      if (idx === -1) {
        reject(new Error('Loading dispatch not found'))
        return
      }
      if (payload.dispatchNo && store.some((s, i) => i !== idx && s.dispatchNo === payload.dispatchNo)) {
        reject(new Error('Dispatch number must be unique'))
        return
      }
      let items = store[idx].items.slice()
      if (payload.items) {
        items = payload.items.map((it) => {
          return {
            id: it.id ?? generateId('LDI'),
            itemId: it.itemId ?? '',
            itemCode: it.itemCode ?? '',
            itemName: it.itemName ?? '',
            qty: Number(it.qty ?? 0),
            weight: Number(it.weight ?? 0),
            notes: it.notes ?? '',
            createdAt: nowDate(),
          }
        })
      }
      const totals = calcTotals(items)
      const updated: LoadingDispatch = {
        ...store[idx],
        dispatchNo: payload.dispatchNo ?? store[idx].dispatchNo,
        warehouseId: payload.warehouseId ?? store[idx].warehouseId,
        warehouseName: payload.warehouseName ?? store[idx].warehouseName,
        vehicleNo: payload.vehicleNo ?? store[idx].vehicleNo,
        driverName: payload.driverName ?? store[idx].driverName,
        dispatchDate: payload.dispatchDate ?? store[idx].dispatchDate,
        status: payload.status ?? store[idx].status,
        remarks: payload.remarks ?? store[idx].remarks,
        items,
        totalQuantity: totals.totalQuantity,
        totalWeight: totals.totalWeight,
        createdAt: store[idx].createdAt,
      }
      store[idx] = updated
      writeStore(store)
      resolve(updated)
    }, 180)
  })
}

/**
 * @function deleteLoadingDispatch
 * @description Delete a loading dispatch record by id.
 */
export const deleteLoadingDispatch = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Loading dispatch not found'))
        return
      }
      store.splice(idx, 1)
      writeStore(store)
      resolve()
    }, 140)
  })
}