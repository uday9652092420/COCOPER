/**
 * @file customer.types.ts
 * @description Types used by Customer Master module.
 */

export type CustomerType =
  | "Premium"
  | "Local"
  | "Red";

export type CustomerStatus =
  | "Active"
  | "Inactive";

/**
 * Customer record
 */
export interface Customer {

  id: string;

  code: string;

  name: string;

  type: CustomerType;

  state?: string;

  address?: string;

  mobile?: string;

  whatsapp?: string;

  contact_person?: string;

  contact_person1?: string;

  contact_no1?: string;

  contact_person2?: string;

  contact_no2?: string;

  credit_limit: number;

  status: CustomerStatus;

  created_at: string;

}

/**
 * Create Customer Payload
 */
export interface CreateCustomerInput {

  code: string;

  name: string;

  type: CustomerType;

  state?: string;

  address?: string;

  mobile?: string;

  whatsapp?: string;

  contact_person?: string;

  contact_person1?: string;

  contact_no1?: string;

  contact_person2?: string;

  contact_no2?: string;

  credit_limit: number;

  status: CustomerStatus;

}

/**
 * Update Customer Payload
 */
export interface UpdateCustomerInput {

  code: string;

  name: string;

  type: CustomerType;

  state?: string;

  address?: string;

  mobile?: string;

  whatsapp?: string;

  contact_person?: string;

  contact_person1?: string;

  contact_no1?: string;

  contact_person2?: string;

  contact_no2?: string;

  credit_limit: number;

  status: CustomerStatus;

}