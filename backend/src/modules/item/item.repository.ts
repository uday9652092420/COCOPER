import { pool } from "../../config/db.js";
import { Item, ItemBranchStock, ItemBranchStockInput, ItemCreateDTO } from "./item.types.js";
import { getNextScopedCode } from "../../utils/codeGenerator.js";

/**
 * Generate Next Item Code (organization-scoped).
 * Example: items for "Maiprosoft" org -> MI-01, MI-02, ...
 */
export async function getNextItemCodeRepo(organizationId?: string | null): Promise<string> {
  return getNextScopedCode({
    table: "items",
    scopeColumn: "organization_id",
    scopeId: organizationId ?? null,
    scopeLabelTable: "organizations",
    scopeLabelColumn: "organization_name",
    moduleLetter: "I",
    fallbackPrefix: "IT",
    padLength: 2,
  });
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
      : await getNextItemCodeRepo(payload.organization_id ?? null);

  const values = [
    id,
    itemCode,
    payload.name,
    payload.category ?? null,
    payload.uom ?? null,
    payload.status ?? "Active",
    payload.organization_id ?? null,
    payload.branch_wise_stock ?? 0,
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
      branch_wise_stock,
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
      branch_wise_stock,
      created_at
    `,
    values
  );

  return rows[0];
}

/**
 * List Items (organization-scoped)
 */
export async function listItemsRepo(organizationId?: string | null): Promise<Item[]> {
  const params: string[] = [];
  const conditions: string[] = [];

  if (organizationId) {
    params.push(organizationId);
    conditions.push(`organization_id = $${params.length}`);
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
      branch_wise_stock,
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
      branch_wise_stock,
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
      status=$6,
      branch_wise_stock=$7
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
      branch_wise_stock,
      created_at
    `,
    [
      id,
      payload.code,
      payload.name,
      payload.category ?? null,
      payload.uom ?? null,
      payload.status ?? "Active",
      payload.branch_wise_stock ?? 0,
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

export async function listItemBranchStockRepo(
  itemId: string,
  organizationId: string
): Promise<ItemBranchStock[]> {
  const { rows } = await pool.query(
    `SELECT id, organization_id, item_id, item_code, branch_id, branch_name, stock
     FROM item_branch_stock
     WHERE item_id = $1 AND organization_id = $2
     ORDER BY branch_name`,
    [itemId, organizationId]
  );
  return rows;
}

export async function replaceItemBranchStockRepo(
  itemId: string,
  organizationId: string,
  itemCode: string,
  rows: ItemBranchStockInput[]
): Promise<ItemBranchStock[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM item_branch_stock WHERE item_id = $1 AND organization_id = $2",
      [itemId, organizationId]
    );
    for (const row of rows) {
      await client.query(
        `INSERT INTO item_branch_stock
          (id, organization_id, item_id, item_code, branch_id, branch_name, stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          `IBS-${Date.now()}-${row.branch_id}`,
          organizationId,
          itemId,
          itemCode,
          row.branch_id,
          row.branch_name,
          row.stock,
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return listItemBranchStockRepo(itemId, organizationId);
}