/**
 * @file supplier.repository.ts
 * @description Database operations for Supplier Master module.
 */


import { pool } from "../../config/db.js";
import { getNextScopedCode } from "../../utils/codeGenerator.js";

import {
  Supplier,
  SupplierCreateDTO
} from "./supplier.types.js";



/**
 * Get Next Supplier Code (organization-scoped)
 *
 * Example:
 * Suppliers in the "Maiprosoft" org -> MS-01
 */
export async function getNextSupplierCodeRepo(organizationId?: string | null)
: Promise<string> {


  return getNextScopedCode({
    table: "suppliers",
    scopeColumn: "organization_id",
    scopeId: organizationId ?? null,
    scopeLabelTable: "organizations",
    scopeLabelColumn: "organization_name",
    moduleLetter: "S",
    fallbackPrefix: "SUP",
    padLength: 2,
  });


}





/**
 * Create Supplier
 */
export async function createSupplierRepo(
  payload: SupplierCreateDTO
): Promise<Supplier>{


  const id =
    payload.id ||
    `SUP-${Date.now()}`;



  const code =
    payload.code?.trim()
    ||
    await getNextSupplierCodeRepo(
      payload.organization_id ?? null
    );



  const { rows } = await pool.query(
    `
    INSERT INTO suppliers
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
      opening_balance,
      status,
      organization_id,
      created_at
    )

    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
      CURRENT_DATE
    )

    RETURNING *
    `,
    [

      id,

      code,

      payload.name,

      payload.type ?? "Local",

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

      payload.opening_balance ?? 0,

      payload.status ?? "Active",

      payload.organization_id ?? null

    ]
  );



  return rows[0];

}







/**
 * List Suppliers
 */
export async function listSuppliersRepo(organizationId?: string | null)
: Promise<Supplier[]> {

  const params: string[] = [];
  let where = "";

  if (organizationId) {
    params.push(organizationId);
    where = "WHERE organization_id = $1";
  }

  const { rows } = await pool.query(`
    SELECT *
    FROM suppliers
    ${where}
    ORDER BY created_at DESC
  `, params);



  return rows;

}







/**
 * Get Supplier By Id
 */
export async function getSupplierByIdRepo(
  id:string,
  organizationId: string
)
: Promise<Supplier | null>{


  const { rows } = await pool.query(
    `
    SELECT *
    FROM suppliers
    WHERE id=$1 AND organization_id=$2
    `,
    [
      id,
      organizationId
    ]
  );



  return rows[0] ?? null;

}








/**
 * Update Supplier
 */
export async function updateSupplierRepo(
  id:string,

  payload:SupplierCreateDTO,
  organizationId: string

)
: Promise<Supplier | null>{



  const { rows } = await pool.query(
    `
    UPDATE suppliers

    SET

      code=$2,

      name=$3,

      type=$4,

      state=$5,

      address=$6,

      mobile=$7,

      whatsapp=$8,

      contact_person=$9,

      contact_person1=$10,

      contact_no1=$11,

      contact_person2=$12,

      contact_no2=$13,

      contact_person3=$14,

      contact_no3=$15,

      opening_balance=$16,

      status=$17


    WHERE id=$1 AND organization_id=$18


    RETURNING *
    `,

    [

      id,

      payload.code,

      payload.name,

      payload.type,

      payload.state,

      payload.address,

      payload.mobile,

      payload.whatsapp,

      payload.contact_person,

      payload.contact_person1,

      payload.contact_no1,

      payload.contact_person2,

      payload.contact_no2,

      payload.contact_person3,

      payload.contact_no3,

      payload.opening_balance,

      payload.status,
      organizationId

    ]

  );



  return rows[0] ?? null;

}









/**
 * Delete Supplier
 */
export async function deleteSupplierRepo(
  id:string,
  organizationId: string
){

  const result = await pool.query(
    `
    DELETE FROM suppliers

    WHERE id=$1 AND organization_id=$2

    RETURNING *
    `,
    [
      id,
      organizationId
    ]
  );



  if(result.rowCount === 0){

    throw new Error(
      "Supplier not found"
    );

  }



  return {

    message:
      "Supplier deleted successfully"

  };

}








/**
 * Check Supplier Usage
 *
 * Future:
 * - Purchase
 * - Stock Transactions
 * - Payments
 */
export async function checkSupplierUsageRepo(
  id:string
){

  const usedIn:string[] = [];


  /*
    Example:

    const purchase =
      await pool.query(
        `
        SELECT id
        FROM purchases
        WHERE supplier_id=$1
        `,
        [id]
      );


    if(purchase.rows.length){
      usedIn.push("Purchase");
    }

  */


  return usedIn;

}