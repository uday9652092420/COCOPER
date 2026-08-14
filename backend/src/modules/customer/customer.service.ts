/**
 * @file customer.service.ts
 * @description Service layer for Customer Master module.
 */

import {
  customerSchema,
} from "./customer.validation.js";

import {
  listCustomersRepository,
  getCustomerRepository,
  getCustomerByCodeRepository,
  createCustomerRepository,
  updateCustomerRepository,
  deleteCustomerRepository,
  getNextCustomerCodeRepository,
} from "./customer.repository.js";

import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./customer.types.js";

/**
 * Get Next Customer Code
 */
export async function getNextCustomerCodeService(): Promise<string> {
  return getNextCustomerCodeRepository();
}

/**
 * List Customers
 */
export async function listCustomersService(organizationId?: string | null): Promise<Customer[]> {
  return listCustomersRepository(organizationId ?? null);
}

/**
 * Get Customer By Id
 */
export async function getCustomerService(
  id: string
): Promise<Customer> {

  const customer = await getCustomerRepository(id);

  if (!customer) {
    throw {
      status: 404,
      message: "Customer not found",
    };
  }

  return customer;
}

/**
 * Create Customer
 */
export async function createCustomerService(
  payload: CreateCustomerInput
): Promise<Customer> {

  const validated =
    customerSchema.parse(payload);

  /**
   * Business Rule
   * Red customers cannot have credit
   */
  if (validated.type === "Red") {
    validated.credit_limit = 0;
  }

  /**
   * Duplicate Code Check
   */
  const existing =
    await getCustomerByCodeRepository(
      validated.code
    );

  if (existing) {
    throw {
      status: 409,
      message: "Customer code already exists",
    };
  }

  return createCustomerRepository(validated);
}

/**
 * Update Customer
 */
export async function updateCustomerService(
  id: string,
  payload: UpdateCustomerInput
): Promise<Customer> {

  const existing =
    await getCustomerRepository(id);

  if (!existing) {
    throw {
      status: 404,
      message: "Customer not found",
    };
  }

  const validated =
    customerSchema.parse(payload);

  /**
   * Business Rule
   */
  if (validated.type === "Red") {
    validated.credit_limit = 0;
  }

  /**
   * Prevent Duplicate Codes
   */
  const duplicate =
    await getCustomerByCodeRepository(
      validated.code
    );

  if (
    duplicate &&
    duplicate.id !== id
  ) {
    throw {
      status: 409,
      message: "Customer code already exists",
    };
  }

  return updateCustomerRepository(
    id,
    validated
  );
}

/**
 * Delete Customer
 */
export async function deleteCustomerService(
  id: string
): Promise<{ message: string }> {

  const existing =
    await getCustomerRepository(id);

  if (!existing) {
    throw {
      status: 404,
      message: "Customer not found",
    };
  }

  await deleteCustomerRepository(id);

  return {
    message: "Customer deleted successfully",
  };
}