/**
 * @file dataStore.ts
 * @description In-memory + localStorage backed data store providing add/edit/delete/list
 *              operations for warehouses. Simulates async API behavior for the frontend.
 *
 * Usage:
 *  import { listWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } from './dataStore'
 *
 * This is intentionally lightweight so it can be replaced by a real backend later.
 */

import type { Warehouse, WarehouseCreatePayload, WarehouseUpdatePayload } from './types'

/**
 * @constant STORAGE_KEY
 * @description localStorage key used to persist warehouses across reloads.
 */
const STORAGE_KEY = 'wc_warehouses_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function seedData
 * @description Default initial records if no persisted data exists.
 */
const seedData = (): Warehouse[] => [
  {
    id: 'WH1',
    code: 'WH-1',
    name: 'Central Warehouse',
    address: 'No. 1, Main Road, Coconut City',
    manager: 'Manager A',
    contactNumber: '9000012345',
    status: 'Active',
    createdAt: nowDate(),
  },
  {
    id: 'WH2',
    code: 'WH-2',
    name: 'North Warehouse',
    address: 'No. 2, North Road, Coconut City',
    manager: 'Manager B',
    contactNumber: '9000012346',
    status: 'Active',
    createdAt: nowDate(),
  },
]

/**
 * @function readStorage
 * @description Read and parse persisted warehouses, fallback to seedData().
 */
const readStorage = (): Warehouse[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as Warehouse[]
    if (!Array.isArray(parsed)) return seedData()
    return parsed
  } catch (e) {
    return seedData()
  }
}

/**
 * @function writeStorage
 * @description Persist warehouses to localStorage.
 */
const writeStorage = (data: Warehouse[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @description Internal in-memory cache (initialized lazily).
 */
let cache: Warehouse[] | null = null

/**
 * @function getCache
 * @description Ensure cache is available and return it.
 */
const getCache = (): Warehouse[] => {
  if (!cache) {
    cache = readStorage()
  }
  return cache
}

/**
 * @function persist
 * @description Persist current cache to storage.
 */
const persist = () => {
  if (cache) writeStorage(cache)
}

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (): string => `WH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function listWarehouses
 * @description Return all warehouses. Simulates async by returning a Promise.
 */
export const listWarehouses = async (): Promise<Warehouse[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCache()!.slice())
    }, 120)
  })
}

/**
 * @function getWarehouse
 * @description Get single warehouse by id.
 */
export const getWarehouse = async (id: string): Promise<Warehouse | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = getCache()!.find((w) => w.id === id)
      resolve(found)
    }, 80)
  })
}

/**
 * @function createWarehouse
 * @description Create a new warehouse record and persist it.
 */
export const createWarehouse = async (payload: WarehouseCreatePayload): Promise<Warehouse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      // Unique code enforcement
      if (current.some((c) => c.code === payload.code)) {
        reject(new Error('Warehouse code must be unique'))
        return
      }
      const rec: Warehouse = {
        id: generateId(),
        code: payload.code,
        name: payload.name,
        address: payload.address ?? '',
        manager: payload.manager ?? '',
        contactNumber: payload.contactNumber ?? '',
        status: payload.status ?? 'Active',
        createdAt: nowDate(),
      }
      current.unshift(rec)
      persist()
      resolve(rec)
    }, 150)
  })
}

/**
 * @function updateWarehouse
 * @description Update an existing warehouse by id.
 */
export const updateWarehouse = async (id: string, payload: WarehouseUpdatePayload): Promise<Warehouse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Warehouse not found'))
        return
      }
      // If code is changing, ensure uniqueness
      if (payload.code && current.some((c, i) => i !== idx && c.code === payload.code)) {
        reject(new Error('Warehouse code must be unique'))
        return
      }
      const updated: Warehouse = {
        ...current[idx],
        ...payload,
        createdAt: current[idx].createdAt,
      }
      current[idx] = updated
      persist()
      resolve(updated)
    }, 150)
  })
}

/**
 * @function deleteWarehouse
 * @description Delete a warehouse record by id.
 */
export const deleteWarehouse = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Warehouse not found'))
        return
      }
      current.splice(idx, 1)
      persist()
      resolve()
    }, 120)
  })
}