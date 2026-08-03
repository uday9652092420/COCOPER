/**
 * @file dataStore.ts
 * @description In-memory + localStorage backed data store providing add/edit/delete/list
 *              operations for labours. Simulates async API behavior for the frontend.
 *
 * Usage:
 *  import { listLabours, getLabour, createLabour, updateLabour, deleteLabour } from './dataStore'
 *
 * This is intentionally lightweight so it can be replaced by a real backend later.
 */

import type { Labour, LabourCreatePayload, LabourUpdatePayload } from './types'

/**
 * @constant STORAGE_KEY
 * @description localStorage key used to persist labours across reloads.
 */
const STORAGE_KEY = 'wc_labours_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (prefix = 'LAB'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default initial records if no persisted data exists.
 */
const seedData = (): Labour[] => [
  {
    id: 'LABS1',
    labourName: 'Ram Kumar',
    gender: 'Male',
    contactNumber: '980000001',
    address: 'No 1, Worker Lane',
    inTime: '09:00',
    outTime: '18:00',
    overtime_5_8: 120,
    overtime_6_8: 90,
    overtime_7_8: 60,
    overtime_7p_9p: 150,
    overtime_7p_10p: 200,
    loadingAmount: 400,
    status: 'Active',
    createdAt: nowDate(),
  },
  {
    id: 'LABS2',
    labourName: 'Sita Devi',
    gender: 'Female',
    contactNumber: '980000002',
    address: 'No 2, Worker Lane',
    inTime: '08:30',
    outTime: '17:30',
    overtime_5_8: 80,
    overtime_6_8: 60,
    overtime_7_8: 40,
    overtime_7p_9p: 100,
    overtime_7p_10p: 120,
    loadingAmount: 350,
    status: 'Active',
    createdAt: nowDate(),
  },
  {
    id: 'LABS3',
    labourName: 'Raju',
    gender: 'Male',
    contactNumber: '980000003',
    address: 'No 3, Worker Lane',
    inTime: '09:00',
    outTime: '18:00',
    overtime_5_8: 50,
    overtime_6_8: 40,
    overtime_7_8: 30,
    overtime_7p_9p: 60,
    overtime_7p_10p: 80,
    loadingAmount: 200,
    status: 'Inactive',
    createdAt: nowDate(),
  },
]

/**
 * @function readStorage
 * @description Read and parse persisted labours, fallback to seedData().
 */
const readStorage = (): Labour[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as Labour[]
    if (!Array.isArray(parsed)) return seedData()
    return parsed
  } catch (e) {
    return seedData()
  }
}

/**
 * @function writeStorage
 * @description Persist labours to localStorage.
 */
const writeStorage = (data: Labour[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @description Internal in-memory cache (initialized lazily).
 */
let cache: Labour[] | null = null

/**
 * @function getCache
 * @description Ensure cache is available and return it.
 */
const getCache = (): Labour[] => {
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
 * @function listLabours
 * @description Return all labours. Simulates async by returning a Promise.
 */
export const listLabours = async (): Promise<Labour[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCache()!.slice())
    }, 120)
  })
}

/**
 * @function getLabour
 * @description Get single labour by id.
 */
export const getLabour = async (id: string): Promise<Labour | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = getCache()!.find((w) => w.id === id)
      resolve(found)
    }, 80)
  })
}

/**
 * @function createLabour
 * @description Create a new labour record and persist it.
 */
export const createLabour = async (payload: LabourCreatePayload): Promise<Labour> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const current = getCache()!
      const rec: Labour = {
        id: generateId('LAB'),
        labourName: payload.labourName,
        gender: payload.gender ?? 'Male',
        contactNumber: payload.contactNumber ?? '',
        address: payload.address ?? '',
        inTime: payload.inTime ?? '',
        outTime: payload.outTime ?? '',
        overtime_5_8: Number(payload.overtime_5_8 ?? 0),
        overtime_6_8: Number(payload.overtime_6_8 ?? 0),
        overtime_7_8: Number(payload.overtime_7_8 ?? 0),
        overtime_7p_9p: Number(payload.overtime_7p_9p ?? 0),
        overtime_7p_10p: Number(payload.overtime_7p_10p ?? 0),
        loadingAmount: Number(payload.loadingAmount ?? 0),
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
 * @function updateLabour
 * @description Update an existing labour by id.
 */
export const updateLabour = async (id: string, payload: LabourUpdatePayload): Promise<Labour> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Labour not found'))
        return
      }
      const updated: Labour = {
        ...current[idx],
        labourName: payload.labourName ?? current[idx].labourName,
        gender: payload.gender ?? current[idx].gender,
        contactNumber: payload.contactNumber ?? current[idx].contactNumber,
        address: payload.address ?? current[idx].address,
        inTime: payload.inTime ?? current[idx].inTime,
        outTime: payload.outTime ?? current[idx].outTime,
        overtime_5_8: Number(payload.overtime_5_8 ?? current[idx].overtime_5_8),
        overtime_6_8: Number(payload.overtime_6_8 ?? current[idx].overtime_6_8),
        overtime_7_8: Number(payload.overtime_7_8 ?? current[idx].overtime_7_8),
        overtime_7p_9p: Number(payload.overtime_7p_9p ?? current[idx].overtime_7p_9p),
        overtime_7p_10p: Number(payload.overtime_7p_10p ?? current[idx].overtime_7p_10p),
        loadingAmount: Number(payload.loadingAmount ?? current[idx].loadingAmount),
        status: (payload.status as Labour['status']) ?? current[idx].status,
        createdAt: current[idx].createdAt,
      }
      current[idx] = updated
      persist()
      resolve(updated)
    }, 150)
  })
}

/**
 * @function deleteLabour
 * @description Delete a labour record by id.
 */
export const deleteLabour = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Labour not found'))
        return
      }
      current.splice(idx, 1)
      persist()
      resolve()
    }, 120)
  })
}