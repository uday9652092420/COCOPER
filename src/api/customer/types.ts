/**
 * @file src/api/customer/types.ts
 * @description TypeScript types and interfaces for customer API.
 */

/**
 * @interface Customer
 * @description Represents a customer master record.
 */
export interface Customer {
  id: string
  code: string
  name: string
  type: 'Premium' | 'Local' | 'Red'
  state?: string
  address?: string
  mobile?: string
  whatsapp?: string
  contactPerson?: string
  contactPerson1?: string
  contactNo1?: string
  contactPerson2?: string
  contactNo2?: string
  creditLimit: number
  status: 'Active' | 'Inactive'
  createdAt: string // ISO date (YYYY-MM-DD)
}

/**
 * @interface NewCustomer
 * @description Payload used to create a new customer (id and createdAt are assigned server-side).
 */
export interface NewCustomer {
  code: string
  name: string
  type: 'Premium' | 'Local' | 'Red'
  state?: string
  address?: string
  mobile?: string
  whatsapp?: string
  contactPerson?: string
  contactPerson1?: string
  contactNo1?: string
  contactPerson2?: string
  contactNo2?: string
  creditLimit?: number
  status?: 'Active' | 'Inactive'
}

/**
 * @interface UpdateCustomer
 * @description Partial payload to update an existing customer.
 */
export type UpdateCustomer = Partial<NewCustomer> & { id: string }