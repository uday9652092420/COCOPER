/**
 * @file customer.repository.ts
 * @description Repository layer for Customer Master.
 */

import { pool } from "../../config/db.js";

import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./customer.types.js";

/**
 * Get all customers
 */
export async function listCustomersRepository(): Promise<Customer[]> {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      code,
      name,
      type,
      state,
      address,
      mobile,
      whatsapp,
      contact_person,
      contact_person1,
      contact_no1,
      contact_person2,
      contact_no2,
      credit_limit,
      status,
      created_at
    FROM customers
    ORDER BY created_at DESC, code ASC
    `
  );

  return rows;
}

/**
 * Get customer by id
 */
export async function getCustomerRepository(
  id: string
): Promise<Customer | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      code,
      name,
      type,
      state,
      address,
      mobile,
      whatsapp,
      contact_person,
      contact_person1,
      contact_no1,
      contact_person2,
      contact_no2,
      credit_limit,
      status,
      created_at
    FROM customers
    WHERE id = $1
    `,
    [id]
  );

  return rows[0] ?? null;
}

/**
 * Get customer by code
 */
export async function getCustomerByCodeRepository(
  code: string
): Promise<Customer | null> {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM customers
    WHERE code = $1
    `,
    [code]
  );

  return rows[0] ?? null;
}

/**
 * Create customer
 */
export async function createCustomerRepository(
  payload: CreateCustomerInput
): Promise<Customer> {
  const { rows } = await pool.query(
    `
    INSERT INTO customers
    (
      id,
      code,
      name,
      type,
      state,
      address,
      mobile,
      whatsapp,
      contact_person,
      contact_person1,
      contact_no1,
      contact_person2,
      contact_no2,
      credit_limit,
      status
    )
    VALUES
    (
      gen_random_uuid()::text,
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,
      $13,$14
    )
    RETURNING *
    `,
    [
      payload.code,
      payload.name,
      payload.type,
      payload.state ?? "",
      payload.address ?? "",
      payload.mobile ?? "",
      payload.whatsapp ?? "",
      payload.contact_person ?? "",
      payload.contact_person1 ?? "",
      payload.contact_no1 ?? "",
      payload.contact_person2 ?? "",
      payload.contact_no2 ?? "",
      payload.credit_limit,
      payload.status,
    ]
  );

  return rows[0];
}

/**
 * Update customer
 */
export async function updateCustomerRepository(
  id: string,
  payload: UpdateCustomerInput
): Promise<Customer> {
  const { rows } = await pool.query(
    `
    UPDATE customers
    SET
      code=$1,
      name=$2,
      type=$3,
      state=$4,
      address=$5,
      mobile=$6,
      whatsapp=$7,
      contact_person=$8,
      contact_person1=$9,
      contact_no1=$10,
      contact_person2=$11,
      contact_no2=$12,
      credit_limit=$13,
      status=$14
    WHERE id=$15
    RETURNING *
    `,
    [
      payload.code,
      payload.name,
      payload.type,
      payload.state ?? "",
      payload.address ?? "",
      payload.mobile ?? "",
      payload.whatsapp ?? "",
      payload.contact_person ?? "",
      payload.contact_person1 ?? "",
      payload.contact_no1 ?? "",
      payload.contact_person2 ?? "",
      payload.contact_no2 ?? "",
      payload.credit_limit,
      payload.status,
      id,
    ]
  );

  return rows[0];
}

/**
 * Delete customer
 */
export async function deleteCustomerRepository(
  id: string
): Promise<void> {
  await pool.query(
    `
    DELETE
    FROM customers
    WHERE id=$1
    `,
    [id]
  );
}

/**
 * Next customer code
 * Example:
 * CUST-001
 * CUST-002
 */
export async function getNextCustomerCodeRepository(): Promise<string> {
  const { rows } = await pool.query(
    `
    SELECT code
    FROM customers
    ORDER BY code DESC
    LIMIT 1
    `
  );

  if (!rows.length) {
    return "CUST-001";
  }

  const lastCode = rows[0].code as string;

  const number = Number(lastCode.replace("CUST-", "")) + 1;

  return `CUST-${number.toString().padStart(3, "0")}`;
}