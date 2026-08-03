/**
 * @file dataStore.ts
 * @description In-memory + localStorage backed data store providing add/edit/delete/list
 *              operations for items. Simulates async API behavior for the frontend.
 *
 * Usage:
 *  import { listItems, getItem, createItem, updateItem, deleteItem } from './dataStore'
 *
 * This is intentionally lightweight so it can be replaced by a real backend later.
 */

import type { Item, ItemCreatePayload, ItemUpdatePayload } from './types'

/**
 * @constant STORAGE_KEY
 * @description localStorage key used to persist items across reloads.
 */
const STORAGE_KEY = 'wc_items_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function seedData
 * @description Default initial records if no persisted data exists.
 */
const seedData = (): Item[] => [
  {
    id: 'IT1',
    code: 'IT-1',
    name: 'Coconut Premium',
    category: 'Fresh',
    uom: 'Kg',
    status: 'Active',
    createdAt: nowDate(),
  },
  {
    id: 'IT2',
    code: 'IT-2',
    name: 'Medium Coconut',
    category: 'Fresh',
    uom: 'Kg',
    status: 'Active',
    createdAt: nowDate(),
  },
]

/**
 * @function readStorage
 * @description Read and parse persisted items, fallback to seedData().
 */
const readStorage = (): Item[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as Item[]
    if (!Array.isArray(parsed)) return seedData()
    return parsed
  } catch (e) {
    return seedData()
  }
}

/**
 * @function writeStorage
 * @description Persist items to localStorage.
 */
const writeStorage = (data: Item[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @description Internal in-memory cache (initialized lazily).
 */
let cache: Item[] | null = null

/**
 * @function getCache
 * @description Ensure cache is available and return it.
 */
const getCache = (): Item[] => {
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
const generateId = (): string => `IT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function listItems
 * @description Return all items. Simulates async by returning a Promise.
 */
export const listItems = async (): Promise<Item[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCache()!.slice())
    }, 120)
  })
}

/**
 * @function getItem
 * @description Get single item by id.
 */
export const getItem = async (id: string): Promise<Item | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = getCache()!.find((w) => w.id === id)
      resolve(found)
    }, 80)
  })
}

/**
 * @function createItem
 * @description Create a new item record and persist it.
 */
export const createItem = async (payload: ItemCreatePayload): Promise<Item> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      // Unique code enforcement
      if (current.some((c) => c.code === payload.code)) {
        reject(new Error('Item code must be unique'))
        return
      }
      const rec: Item = {
        id: generateId(),
        code: payload.code,
        name: payload.name,
        category: payload.category ?? '',
        uom: payload.uom ?? '',
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
 * @function updateItem
 * @description Update an existing item by id.
 */
export const updateItem = async (id: string, payload: ItemUpdatePayload): Promise<Item> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Item not found'))
        return
      }
      // If code is changing, ensure uniqueness
      if (payload.code && current.some((c, i) => i !== idx && c.code === payload.code)) {
        reject(new Error('Item code must be unique'))
        return
      }
      const updated: Item = {
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
 * @function deleteItem
 * @description Delete an item record by id.
 */
export const deleteItem = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Item not found'))
        return
      }
      current.splice(idx, 1)
      persist()
      resolve()
    }, 120)
  })
}