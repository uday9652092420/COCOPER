import { pool } from "../../config/db.js";
import { GunnyBag, GunnyBagCreateDTO } from "./gunnybag.types.js";
/**
 * Get Next Gunny Bag Code
 * Example:
 * GB-001
 * GB-002
 * GB-003
 */
export async function getNextGunnyBagCodeRepo(): Promise<string> {
  const { rows } = await pool.query(`
    SELECT code
    FROM gunny_bags
    WHERE code LIKE 'GB-%'
    ORDER BY CAST(SUBSTRING(code FROM 4) AS INTEGER) DESC
    LIMIT 1
  `);

  if (rows.length === 0) {
    return "GB-001";
  }

  const lastCode = rows[0].code;

  const lastNumber = parseInt(
    lastCode.replace("GB-", ""),
    10
  );

  return `GB-${String(lastNumber + 1).padStart(3, "0")}`;
}

/**
 * Create Gunny Bag
 */
export async function createGunnyBagRepo(
  payload: GunnyBagCreateDTO
): Promise<GunnyBag> {

  const id = payload.id || `GB-${Date.now()}`;

  const code =
    payload.code?.trim() ||
    (await getNextGunnyBagCodeRepo());

  const { rows } = await pool.query(
    `
    INSERT INTO gunny_bags
    (
      id,
      code,
      name,
      size,
      rate_per_bag,
      opening_stock,
      status,
      created_at
    )
    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,CURRENT_DATE
    )
    RETURNING *
    `,
    [
      id,
      code,
      payload.name,
      payload.size ?? "",
      payload.rate_per_bag ?? 0,
      payload.opening_stock ?? 0,
      payload.status ?? "Active",
    ]
  );

  return rows[0];
}

/**
 * List Gunny Bags
 */
export async function listGunnyBagsRepo(): Promise<GunnyBag[]> {

  const { rows } = await pool.query(`
    SELECT *
    FROM gunny_bags
    ORDER BY created_at DESC
  `);

  return rows;
}

/**
 * Get Gunny Bag By Id
 */
export async function getGunnyBagByIdRepo(
  id: string
): Promise<GunnyBag | null> {

  const { rows } = await pool.query(
    `
    SELECT *
    FROM gunny_bags
    WHERE id=$1
    `,
    [id]
  );

  return rows[0] ?? null;
}

/**
 * Update Gunny Bag
 */
export async function updateGunnyBagRepo(
  id: string,
  payload: GunnyBagCreateDTO
): Promise<GunnyBag | null> {

  const { rows } = await pool.query(
    `
    UPDATE gunny_bags
    SET
      code=$2,
      name=$3,
      size=$4,
      rate_per_bag=$5,
      opening_stock=$6,
      status=$7
    WHERE id=$1
    RETURNING *
    `,
    [
      id,
      payload.code,
      payload.name,
      payload.size,
      payload.rate_per_bag,
      payload.opening_stock,
      payload.status,
    ]
  );

  return rows[0] ?? null;
}

/**
 * Delete Gunny Bag
 */
export async function deleteGunnyBagRepo(
  id: string
) {

  const result = await pool.query(
    `
    DELETE FROM gunny_bags
    WHERE id=$1
    RETURNING *
    `,
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error("Gunny Bag not found");
  }

  return {
    message: "Gunny Bag deleted successfully",
  };
}

/**
 * Check Usage
 * (Future use for Purchase / Stock etc.)
 */
export async function checkGunnyBagUsageRepo(
  id: string
) {

  const usedIn: string[] = [];

  // Example
  // if referenced in bag_purchase table
  // usedIn.push("Bag Purchase");

  return usedIn;
}