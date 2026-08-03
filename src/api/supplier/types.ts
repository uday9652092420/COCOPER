/**
 * @file src/api/supplier/types.ts
 * @description TypeScript types and interfaces for supplier API.
 */

/**
 * @interface Supplier
 * @description Represents a supplier master record.
 */
export interface Supplier {
  id: string
  code: string
  name: string
  type: 'Local' | 'National' | 'International'
  state?: string
  address?: string
  mobile?: string
  whatsapp?: string
  contactPerson?: string
  contactPerson1?: string
  contactNo1?: string
  contactPerson2?: string
  contactNo2?: string
  openingBalance: number
  status: 'Active' | 'Inactive'
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface NewSupplier
 * @description Payload used to create a new supplier (id and createdAt assigned server-side).
 */
export interface NewSupplier {
  code: string
  name: string
  type?: 'Local' | 'National' | 'International'
  state?: string
  address?: string
  mobile?: string
  whatsapp?: string
  contactPerson?: string
  contactPerson1?: string
  contactNo1?: string
  contactPerson2?: string
  contactNo2?: string
  openingBalance?: number
  status?: 'Active' | 'Inactive'
}

/**
 * @interface UpdateSupplier
 * @description Partial payload to update an existing supplier.
 */
export type UpdateSupplier = Partial<NewSupplier> & { id: string }