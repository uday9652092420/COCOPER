import { pool } from "../../config/db.js";
import { Item, ItemCreateDTO } from "./item.types.js";

/**
 * Generate Next Item Code
 * Example:
 * IT-1
 * IT-2
 * IT-3
 */
export async function getNextItemCodeRepo(): Promise<string> {
  const { rows } = await pool.query(`
    SELECT code
    FROM items
    WHERE code LIKE 'IT-%'
    ORDER BY CAST(SUBSTRING(code FROM 4) AS INTEGER) DESC
    LIMIT 1
  `);

  if (rows.length === 0) {
    return "IT-1";
  }

  const lastCode = rows[0].code;
  const lastNumber = parseInt(lastCode.replace("IT-", ""), 10);

  return `IT-${lastNumber + 1}`;
}

/**
 * Create Item
 */
export async function createItemRepo(
  payload: ItemCreateDTO
): Promise<Item> {
  const id = payload.id || `IT-${Date.now()}`;

  const itemCode =
    payload.code && payload.code.trim() !== ""
      ? payload.code
      : await getNextItemCodeRepo();

  const values = [
    id,
    itemCode,
    payload.name,
    payload.category ?? null,
    payload.uom ?? null,
    payload.status ?? "Active",
    payload.organization_id ?? null,
    payload.branch_id ?? null,
  ];

  const { rows } = await pool.query(
    `
    INSERT INTO items
    (
      id,
      code,
      name,
      category,
      uom,
      status,
      organization_id,
      branch_id,
      created_at
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      CURRENT_DATE
    )
    RETURNING
      id,
      code,
      name,
      category,
      uom,
      status,
      organization_id,
      branch_id,
      created_at
    `,
    values
  );

  return rows[0];
}

/**
 * List Items
 */
export async function listItemsRepo(organizationId?: string | null, branchId?: string | null): Promise<Item[]> {
  const params: string[] = [];
  const conditions: string[] = [];

  if (organizationId) {
    params.push(organizationId);
    conditions.push(`organization_id = $${params.length} OR organization_id IS NULL`);
  }

  if (branchId) {
    params.push(branchId);
    conditions.push(`branch_id = $${params.length} OR branch_id IS NULL`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT
      id,
      code,
      name,
      category,
      uom,
      status,
      organization_id,
      branch_id,
      created_at
    FROM items
    ${where}
    ORDER BY created_at DESC
    `,
    params
  );

  return rows;
}

/**
 * Get Item By Id
 */
export async function getItemByIdRepo(
  id: string
): Promise<Item | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      code,
      name,
      category,
      uom,
      status,
      organization_id,
      branch_id,
      created_at
    FROM items
    WHERE id=$1
    `,
    [id]
  );

  return rows[0] ?? null;
}

/**
 * Update Item
 */
export async function updateItemRepo(
  id: string,
  payload: ItemCreateDTO
): Promise<Item | null> {
  const { rows } = await pool.query(
    `
    UPDATE items
    SET
      code=$2,
      name=$3,
      category=$4,
      uom=$5,
      status=$6
    WHERE id=$1
    RETURNING
      id,
      code,
      name,
      category,
      uom,
      status,
      organization_id,
      branch_id,
      created_at
    `,
    [
      id,
      payload.code,
      payload.name,
      payload.category ?? null,
      payload.uom ?? null,
      payload.status ?? "Active",
    ]
  );

  return rows[0] ?? null;
}

/**
 * Check whether Item is used in other modules
 * (Add reference tables later)
 */
export async function checkItemUsageRepo(
  id: string
): Promise<string[]> {
  const usedIn: string[] = [];

  /*
  Example:

  const purchaseItems = await pool.query(
    `
    SELECT 1
    FROM purchase_order_items
    WHERE item_id=$1
    LIMIT 1
    `,
    [id]
  );

  if (purchaseItems.rowCount) {
    usedIn.push("Purchase Orders");
  }

  const salesItems = await pool.query(
    `
    SELECT 1
    FROM sales_items
    WHERE item_id=$1
    LIMIT 1
    `,
    [id]
  );

  if (salesItems.rowCount) {
    usedIn.push("Sales");
  }

  */

  return usedIn;
}

/**
 * Delete Item
 */
export async function deleteItemRepo(
  id: string
): Promise<{ message: string }> {
  const result = await pool.query(
    `
    DELETE FROM items
    WHERE id=$1
    RETURNING *
    `,
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error("Item not found");
  }

  return {
    message: "Item deleted successfully",
  };
}