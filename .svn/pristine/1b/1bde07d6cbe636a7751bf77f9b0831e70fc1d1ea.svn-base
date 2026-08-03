/**
 * @file src/api/supplier/dataStore.ts
 * @description In-browser async datastore for supplier master records.
 *
 * Implementation:
 * - Persists data to localStorage under key "mock_suppliers".
 * - Exposes async functions: listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier.
 * - Seeds initial data when storage is empty.
 */

import { Supplier, NewSupplier, UpdateSupplier } from './types'

const STORAGE_KEY = 'mock_suppliers'

/**
 * @function seedData
 * @description Returns seeded suppliers used when localStorage is empty.
 */
const seedData = (): Supplier[] => [
  {
    id: 'SUP-1',
    code: 'SUP-001',
    name: 'Global Supplies Co.',
    type: 'International',
    state: 'Karnataka',
    address: '10 Export Road, Harbor City',
    mobile: '9000200001',
    whatsapp: '9000200001',
    contactPerson: 'Anna',
    contactPerson1: '',
    contactNo1: '',
    contactPerson2: '',
    contactNo2: '',
    openingBalance: 125000,
    status: 'Active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString().slice(0, 10),
  },
  {
    id: 'SUP-2',
    code: 'SUP-002',
    name: 'Local Traders Ltd.',
    type: 'Local',
    state: 'Tamil Nadu',
    address: '2 Market Street, Chennai',
    mobile: '9000200002',
    whatsapp: '9000200002',
    contactPerson: 'Kamal',
    contactPerson1: '',
    contactNo1: '',
    contactPerson2: '',
    contactNo2: '',
    openingBalance: 35000,
    status: 'Active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString().slice(0, 10),
  },
  {
    id: 'SUP-3',
    code: 'SUP-003',
    name: 'National Goods Pvt Ltd',
    type: 'National',
    state: 'Kerala',
    address: '5 Trade Avenue, Kochi',
    mobile: '9000200003',
    whatsapp: '9000200003',
    contactPerson: 'Leena',
    contactPerson1: '',
    contactNo1: '',
    contactPerson2: '',
    contactNo2: '',
    openingBalance: 0,
    status: 'Inactive',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10),
  },
]

/**
 * @function readStore
 * @description Read and parse stored suppliers from localStorage. Seeds if empty.
 */
const readStore = (): Supplier[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const s = seedData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as Supplier[]
  } catch (e) {
    const s = seedData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

/**
 * @function writeStore
 * @description Write suppliers array to localStorage.
 */
const writeStore = (data: Supplier[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * @function listSuppliers
 * @description Return all suppliers (async simulated).
 */
export const listSuppliers = async (): Promise<Supplier[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(readStore())
    }, 180)
  })
}

/**
 * @function getSupplier
 * @description Get supplier by id or undefined if not found.
 */
export const getSupplier = async (id: string): Promise<Supplier | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = readStore().find((s) => s.id === id)
      resolve(found)
    }, 160)
  })
}

/**
 * @function createSupplier
 * @description Create and persist a new supplier.
 */
export const createSupplier = async (payload: NewSupplier): Promise<Supplier> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      // Basic uniqueness check on code
      if (store.some((s) => s.code === payload.code)) {
        reject(new Error('Supplier code must be unique'))
        return
      }
      const id = `SUP-${Date.now()}`
      const rec: Supplier = {
        id,
        code: payload.code,
        name: payload.name,
        type: payload.type ?? 'Local',
        state: payload.state ?? '',
        address: payload.address ?? '',
        mobile: payload.mobile ?? '',
        whatsapp: payload.whatsapp ?? '',
        contactPerson: payload.contactPerson ?? '',
        contactPerson1: payload.contactPerson1 ?? '',
        contactNo1: payload.contactNo1 ?? '',
        contactPerson2: payload.contactPerson2 ?? '',
        contactNo2: payload.contactNo2 ?? '',
        openingBalance: Number(payload.openingBalance ?? 0),
        status: payload.status ?? 'Active',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      store.unshift(rec)
      writeStore(store)
      resolve(rec)
    }, 300)
  })
}

/**
 * @function updateSupplier
 * @description Update an existing supplier. Enforces unique code constraint.
 */
export const updateSupplier = async (payload: UpdateSupplier): Promise<Supplier> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((s) => s.id === payload.id)
      if (idx === -1) return reject(new Error('Supplier not found'))
      // Ensure code uniqueness if changing
      if (payload.code && store.some((s, i) => i !== idx && s.code === payload.code)) {
        return reject(new Error('Supplier code must be unique'))
      }
      const existing = store[idx]
      const merged: Supplier = {
        ...existing,
        ...payload,
        openingBalance: payload.openingBalance !== undefined ? Number(payload.openingBalance) : existing.openingBalance,
        createdAt: existing.createdAt,
      } as Supplier
      store[idx] = merged
      writeStore(store)
      resolve(merged)
    }, 300)
  })
}

/**
 * @function deleteSupplier
 * @description Delete a supplier by id.
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((s) => s.id === id)
      if (idx === -1) return reject(new Error('Supplier not found'))
      store.splice(idx, 1)
      writeStore(store)
      resolve()
    }, 220)
  })
}