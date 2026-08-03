/**
 * @file dataStore.ts
 * @description In-memory + localStorage backed data store providing async add/edit/delete/list
 *              operations for gunny bags. Simulates network latency for frontend usage.
 */

import type { GunnyBag, GunnyBagCreatePayload, GunnyBagUpdatePayload } from './types'

/**
 * @constant STORAGE_KEY
 * @description localStorage key used to persist gunny bags across reloads.
 */
const STORAGE_KEY = 'wc_gunny_bags_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function seedData
 * @description Default initial records if no persisted data exists.
 */
const seedData = (): GunnyBag[] => [
  {
    id: 'GB1',
    code: 'GB-001',
    name: 'Jute Bag',
    size: '25x40 cm',
    ratePerBag: 45,
    openingStock: 100,
    status: 'Active',
    createdAt: nowDate(),
  },
  {
    id: 'GB2',
    code: 'GB-002',
    name: 'Inner Bag',
    size: '30x50 cm',
    ratePerBag: 60,
    openingStock: 50,
    status: 'Active',
    createdAt: nowDate(),
  },
  {
    id: 'GB3',
    code: 'GB-003',
    name: 'Poly Liner',
    size: '20x30 cm',
    ratePerBag: 30,
    openingStock: 200,
    status: 'Active',
    createdAt: nowDate(),
  },
]

/**
 * @function readStorage
 * @description Read and parse persisted gunny bags, fallback to seedData().
 */
const readStorage = (): GunnyBag[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as GunnyBag[]
    if (!Array.isArray(parsed)) return seedData()
    return parsed
  } catch (e) {
    return seedData()
  }
}

/**
 * @function writeStorage
 * @description Persist gunny bags to localStorage.
 */
const writeStorage = (data: GunnyBag[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @description Internal in-memory cache (initialized lazily).
 */
let cache: GunnyBag[] | null = null

/**
 * @function getCache
 * @description Ensure cache is available and return it.
 */
const getCache = (): GunnyBag[] => {
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
const generateId = (prefix = 'GB'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function listGunnyBags
 * @description Return all gunny bags. Simulates async by returning a Promise.
 */
export const listGunnyBags = async (): Promise<GunnyBag[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCache()!.slice())
    }, 120)
  })
}

/**
 * @function getGunnyBag
 * @description Get single gunny bag by id.
 */
export const getGunnyBag = async (id: string): Promise<GunnyBag | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = getCache()!.find((w) => w.id === id)
      resolve(found)
    }, 80)
  })
}

/**
 * @function createGunnyBag
 * @description Create a new gunny bag record and persist it.
 */
export const createGunnyBag = async (payload: GunnyBagCreatePayload): Promise<GunnyBag> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      // Unique code enforcement
      if (current.some((c) => c.code === payload.code)) {
        reject(new Error('Gunny bag code must be unique'))
        return
      }
      const rec: GunnyBag = {
        id: generateId('GB'),
        code: payload.code,
        name: payload.name,
        size: payload.size ?? '',
        ratePerBag: Number(payload.ratePerBag ?? 0),
        openingStock: Number(payload.openingStock ?? 0),
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
 * @function updateGunnyBag
 * @description Update an existing gunny bag by id.
 */
export const updateGunnyBag = async (id: string, payload: GunnyBagUpdatePayload): Promise<GunnyBag> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Gunny bag not found'))
        return
      }
      // If code is changing, ensure uniqueness
      if (payload.code && current.some((c, i) => i !== idx && c.code === payload.code)) {
        reject(new Error('Gunny bag code must be unique'))
        return
      }
      const updated: GunnyBag = {
        ...current[idx],
        ...payload,
        ratePerBag: Number(payload.ratePerBag ?? current[idx].ratePerBag),
        openingStock: Number(payload.openingStock ?? current[idx].openingStock),
        createdAt: current[idx].createdAt,
      } as GunnyBag
      current[idx] = updated
      persist()
      resolve(updated)
    }, 150)
  })
}

/**
 * @function deleteGunnyBag
 * @description Delete a gunny bag record by id.
 */
export const deleteGunnyBag = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Gunny bag not found'))
        return
      }
      current.splice(idx, 1)
      persist()
      resolve()
    }, 120)
  })
}