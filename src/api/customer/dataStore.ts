/**
 * @file src/api/customer/dataStore.ts
 * @description In-browser async datastore for customer master records.
 *
 * Implementation:
 * - Persists data to localStorage under key "mock_customers".
 * - Exposes async functions: list, get, create, update, remove.
 * - Seeds initial data when storage is empty.
 */

import { Customer, NewCustomer, UpdateCustomer } from './types'

const STORAGE_KEY = 'mock_customers'

/**
 * @function seedData
 * @description Returns seeded customers used when localStorage is empty.
 */
const seedData = (): Customer[] => [
  {
    id: 'CUST-1',
    code: 'CUST-001',
    name: 'Apex Traders',
    type: 'Premium',
    state: 'Karnataka',
    address: '12 Market Road, Bangalore',
    mobile: '9000100001',
    whatsapp: '9000100001',
    contactPerson: 'Ramesh',
    contactPerson1: 'Sakthi',
    contactNo1: '9000100101',
    contactPerson2: 'Kumar',
    contactNo2: '9000100201',
    creditLimit: 500000,
    status: 'Active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString().slice(0, 10),
  },
  {
    id: 'CUST-2',
    code: 'CUST-002',
    name: 'Local Fresh',
    type: 'Local',
    state: 'Tamil Nadu',
    address: '5 Street Lane, Chennai',
    mobile: '9000100002',
    whatsapp: '9000100002',
    contactPerson: 'Meena',
    contactPerson1: '',
    contactNo1: '',
    contactPerson2: '',
    contactNo2: '',
    creditLimit: 20000,
    status: 'Active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
  },
  {
    id: 'CUST-3',
    code: 'CUST-003',
    name: 'Red Mart',
    type: 'Red',
    state: 'Kerala',
    address: '9 Harbor Road, Kochi',
    mobile: '9000100003',
    whatsapp: '9000100003',
    contactPerson: 'Prakash',
    contactPerson1: '',
    contactNo1: '',
    contactPerson2: '',
    contactNo2: '',
    creditLimit: 0,
    status: 'Active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
  },
]

/**
 * @function readStore
 * @description Read and parse stored customers from localStorage. Seeds if empty.
 */
const readStore = (): Customer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const s = seedData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as Customer[]
  } catch (e) {
    const s = seedData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

/**
 * @function writeStore
 * @description Write customers array to localStorage.
 */
const writeStore = (data: Customer[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * @function listCustomers
 * @description Return all customers.
 */
export const listCustomers = async (): Promise<Customer[]> => {
  // simulate async
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(readStore())
    }, 200)
  })
}

/**
 * @function getCustomer
 * @description Get customer by id or undefined if not found.
 */
export const getCustomer = async (id: string): Promise<Customer | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = readStore().find((c) => c.id === id)
      resolve(found)
    }, 200)
  })
}

/**
 * @function createCustomer
 * @description Create and persist a new customer. Enforces Red-customer creditLimit = 0 rule.
 */
export const createCustomer = async (payload: NewCustomer): Promise<Customer> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const store = readStore()
      const id = `CUST-${Date.now()}`
      const creditLimit = payload.type === 'Red' ? 0 : Number(payload.creditLimit || 0)
      const newRec: Customer = {
        id,
        code: payload.code,
        name: payload.name,
        type: payload.type,
        state: payload.state || '',
        address: payload.address || '',
        mobile: payload.mobile || '',
        whatsapp: payload.whatsapp || '',
        contactPerson: payload.contactPerson || '',
        contactPerson1: payload.contactPerson1 || '',
        contactNo1: payload.contactNo1 || '',
        contactPerson2: payload.contactPerson2 || '',
        contactNo2: payload.contactNo2 || '',
        creditLimit,
        status: payload.status || 'Active',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      store.unshift(newRec)
      writeStore(store)
      resolve(newRec)
    }, 350)
  })
}

/**
 * @function updateCustomer
 * @description Update an existing customer. Enforces Red-customer creditLimit = 0 rule.
 */
export const updateCustomer = async (payload: UpdateCustomer): Promise<Customer> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((c) => c.id === payload.id)
      if (idx === -1) return reject(new Error('Customer not found'))
      const existing = store[idx]
      const merged: Customer = {
        ...existing,
        ...payload,
        creditLimit: (payload.type ?? existing.type) === 'Red' ? 0 : Number(payload.creditLimit ?? existing.creditLimit),
        createdAt: existing.createdAt,
      } as Customer
      store[idx] = merged
      writeStore(store)
      resolve(merged)
    }, 350)
  })
}

/**
 * @function deleteCustomer
 * @description Delete a customer by id.
 */
export const deleteCustomer = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const store = readStore()
      const idx = store.findIndex((c) => c.id === id)
      if (idx === -1) return reject(new Error('Customer not found'))
      store.splice(idx, 1)
      writeStore(store)
      resolve()
    }, 300)
  })
}