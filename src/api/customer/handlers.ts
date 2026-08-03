/**
 * @file src/api/customer/handlers.ts
 * @description Handler wrappers around dataStore to simulate a small API surface.
 *
 * Exports:
 * - fetchCustomers
 * - fetchCustomer
 * - addCustomer
 * - editCustomer
 * - removeCustomer
 *
 * Each function returns a Promise and can be used by frontend code as a mock HTTP client.
 */

import type { Customer, NewCustomer, UpdateCustomer } from './types'
import { buildApiUrl } from '../config'

const parseJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * @function fetchCustomers
 * @description Fetches list of customers.
 */
export const fetchCustomers = async (): Promise<Customer[]> => {
  const response = await fetch(buildApiUrl('/customers'))
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error((payload as { error?: string })?.error || 'Failed to fetch customers')
  }

  return payload as Customer[]
}

/**
 * @function fetchCustomer
 * @description Fetch a single customer by id.
 */
export const fetchCustomer = async (id: string): Promise<Customer | undefined> => {
  const response = await fetch(buildApiUrl(`/customers/${id}`))
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error((payload as { error?: string })?.error || 'Failed to fetch customer')
  }

  return payload as Customer
}

/**
 * @function addCustomer
 * @description Create a new customer record.
 */
export const addCustomer = async (payload: NewCustomer): Promise<Customer> => {
  if (!payload.code || !payload.name || !payload.type) {
    throw new Error('code, name and type are required')
  }

  const response = await fetch(buildApiUrl('/customers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await parseJson(response)
  if (!response.ok) {
    throw new Error((data as { error?: string })?.error || 'Failed to add customer')
  }

  return data as Customer
}

/**
 * @function editCustomer
 * @description Update an existing customer record.
 */
export const editCustomer = async (payload: UpdateCustomer): Promise<Customer> => {
  if (!payload.id) throw new Error('id is required for update')

  const response = await fetch(buildApiUrl(`/customers/${payload.id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await parseJson(response)
  if (!response.ok) {
    throw new Error((data as { error?: string })?.error || 'Failed to update customer')
  }

  return data as Customer
}

/**
 * @function removeCustomer
 * @description Delete a customer by id.
 */
export const removeCustomer = async (id: string): Promise<void> => {
  const response = await fetch(buildApiUrl(`/customers/${id}`), { method: 'DELETE' })
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error((payload as { error?: string })?.error || 'Failed to delete customer')
  }
}