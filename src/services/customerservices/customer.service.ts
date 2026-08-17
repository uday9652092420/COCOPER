/**
 * @file customer.service.ts
 * @description Customer Master API Service
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface CustomerResponse {
  id: string;

  code: string;

  name: string;

  type:
    | "Premium"
    | "Local"
    | "Red";

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

  status:
    | "Active"
    | "Inactive";

  created_at: string;
}

/**
 * Create Customer
 */
export async function createCustomer(
  payload: {
    code: string;

    name: string;

    type:
      | "Premium"
      | "Local"
      | "Red";

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

    status:
      | "Active"
      | "Inactive";
  }
): Promise<CustomerResponse> {
  const response = await fetch(
    `${API}/customers`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...getOrgHeader(),
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get Next Customer Code
 */
export async function getNextCustomerCode(): Promise<string> {
  const response = await fetch(
    `${API}/customers/next-code`,
    { headers: getOrgHeader() }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get All Customers
 */
export async function getCustomers(): Promise<CustomerResponse[]> {
  const response = await fetch(
    `${API}/customers`,
    { headers: getOrgHeader() }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get Customer By Id
 */
export async function getCustomer(
  id: string
): Promise<CustomerResponse> {
  const response = await fetch(
    `${API}/customers/${id}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Update Customer
 */
export async function updateCustomer(
  id: string,

  payload: {
    code: string;

    name: string;

    type:
      | "Premium"
      | "Local"
      | "Red";

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

    status:
      | "Active"
      | "Inactive";
  }
): Promise<CustomerResponse> {
  const response = await fetch(
    `${API}/customers/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Delete Customer
 */
export async function deleteCustomer(
  id: string
): Promise<{ message: string }> {
  const response = await fetch(
    `${API}/customers/${id}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}