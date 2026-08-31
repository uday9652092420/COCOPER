/**
 * @file customer.repository.ts
 * @description Repository layer for Customer Master.
 */

import { pool } from "../../config/db.js";
import { getNextScopedCode } from "../../utils/codeGenerator.js";

import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./customer.types.js";

/**
 * Get all customers
 */
export async function listCustomersRepository(organizationId?: string | null): Promise<Customer[]> {
  const params: string[] = [];
  let where = "";

  if (organizationId) {
    params.push(organizationId);
    where = "WHERE organization_id = $1";
  }

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
      organization_id,
      created_at
    FROM customers
    ${where}
    ORDER BY created_at DESC, code ASC
    `,
    params
  );

  return rows;
}

/**
 * Get customer by id
 */
export async function getCustomerRepository(
  id: string,
  organizationId: string
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
      contact_person3,
      contact_no3,
      credit_limit,
      status,
      organization_id,
      created_at
    FROM customers
    WHERE id = $1 AND organization_id = $2
    `,
    [id, organizationId]
  );

  return rows[0] ?? null;
}

/**
 * Get customer by code
 */
export async function getCustomerByCodeRepository(
  code: string,
  organizationId: string
): Promise<Customer | null> {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM customers
    WHERE code = $1 AND organization_id = $2
    `,
    [code, organizationId]
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
      contact_person3,
      contact_no3,
      credit_limit,
      status,
      organization_id
    )
    VALUES
    (
      gen_random_uuid()::text,
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,$13,$14,
      $15,$16
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
      payload.contact_person3 ?? "",
      payload.contact_no3 ?? "",
      payload.credit_limit,
      payload.status,
      payload.organization_id ?? null,
    ]
  );

  return rows[0];
}

/**
 * Update customer
 */
export async function updateCustomerRepository(
  id: string,
  payload: UpdateCustomerInput,
  organizationId: string
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
      contact_person3=$13,
      contact_no3=$14,
      credit_limit=$15,
      status=$16
    WHERE id=$17 AND organization_id=$18
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
      payload.contact_person3 ?? "",
      payload.contact_no3 ?? "",
      payload.credit_limit,
      payload.status,
      id,
      organizationId,
    ]
  );

  return rows[0];
}

/**
 * Delete customer
 */
export async function deleteCustomerRepository(
  id: string,
  organizationId: string
): Promise<void> {
  await pool.query(
    `
    DELETE
    FROM customers
    WHERE id=$1 AND organization_id=$2
    `,
    [id, organizationId]
  );
}

/**
 * Next customer code (organization-scoped)
 *
 * Example:
 * Customers in the "Maiprosoft" org -> MC-01
 */
export async function getNextCustomerCodeRepository(organizationId?: string | null): Promise<string> {
  return getNextScopedCode({
    table: "customers",
    scopeColumn: "organization_id",
    scopeId: organizationId ?? null,
    scopeLabelTable: "organizations",
    scopeLabelColumn: "organization_name",
    moduleLetter: "C",
    fallbackPrefix: "CUST",
    padLength: 2,
  });
}