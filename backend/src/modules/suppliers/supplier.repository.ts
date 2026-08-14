/**
 * @file supplier.repository.ts
 * @description Database operations for Supplier Master module.
 */


import { pool } from "../../config/db.js";

import {
  Supplier,
  SupplierCreateDTO
} from "./supplier.types.js";



/**
 * Get Next Supplier Code
 *
 * Example:
 * SUP-001
 * SUP-002
 */
export async function getNextSupplierCodeRepo()
: Promise<string> {


  const { rows } = await pool.query(`
    SELECT code
    FROM suppliers
    WHERE code LIKE 'SUP-%'
    ORDER BY 
      CAST(SUBSTRING(code FROM 5) AS INTEGER) DESC
    LIMIT 1
  `);



  if(rows.length === 0){

    return "SUP-001";

  }



  const lastCode = rows[0].code;


  const lastNumber = parseInt(
    lastCode.replace("SUP-",""),
    10
  );


  return `SUP-${String(lastNumber + 1).padStart(3,"0")}`;

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
    await getNextSupplierCodeRepo();



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
      opening_balance,
      status,
      organization_id,
      created_at
    )

    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,$15,$16,
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
    where = "WHERE organization_id = $1 OR organization_id IS NULL";
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
  id:string
)
: Promise<Supplier | null>{


  const { rows } = await pool.query(
    `
    SELECT *
    FROM suppliers
    WHERE id=$1
    `,
    [
      id
    ]
  );



  return rows[0] ?? null;

}








/**
 * Update Supplier
 */
export async function updateSupplierRepo(
  id:string,

  payload:SupplierCreateDTO

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

      opening_balance=$14,

      status=$15


    WHERE id=$1


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

      payload.opening_balance,

      payload.status

    ]

  );



  return rows[0] ?? null;

}









/**
 * Delete Supplier
 */
export async function deleteSupplierRepo(
  id:string
){

  const result = await pool.query(
    `
    DELETE FROM suppliers

    WHERE id=$1

    RETURNING *
    `,
    [
      id
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