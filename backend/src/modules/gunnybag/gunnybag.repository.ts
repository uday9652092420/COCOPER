/**
 * @file gunnybag.repository.ts
 * @description Repository layer for Gunny Bag Master.
 */

import { pool } from "../../config/db.js";

import {
  GunnyBag,
  GunnyBagCreateDTO,
  GunnyBagBharthiType,
  GunnyBagBharthiTypeCreateDTO,
} from "./gunnybag.types.js";

/**
 * ============================================================
 * Get Next Gunny Bag Code
 * ============================================================
 */
export async function getNextGunnyBagCodeRepo(): Promise<string> {
  const { rows } = await pool.query(`
    SELECT code
    FROM gunny_bags
    WHERE code LIKE 'GB-%'
    ORDER BY
      CAST(
        SUBSTRING(code FROM 4)
        AS INTEGER
      ) DESC
    LIMIT 1
  `);

  if (rows.length === 0) {
    return "GB-001";
  }

  const lastCode = String(rows[0].code);

  const lastNumber = parseInt(
    lastCode.replace("GB-", ""),
    10
  );

  return `GB-${String(lastNumber + 1).padStart(3, "0")}`;
}

/**
 * ============================================================
 * Insert Bharthi Child Records
 * ============================================================
 *
 * IMPORTANT:
 *
 * bharthi is now TEXT.
 *
 * Examples:
 *   "120"
 *   "150"
 *   "200"
 *   "Jute Bag"
 *   "Large Bag"
 *
 * We store the value exactly as received.
 *
 * Current DB columns:
 *
 * id
 * gunny_bag_id
 * bharthi
 * stock
 * created_at
 */
async function insertBharthiTypes(
  client: any,
  gunnyBagId: string,
  bharthiTypes?: GunnyBagBharthiTypeCreateDTO[]
): Promise<void> {
  if (!bharthiTypes || bharthiTypes.length === 0) {
    return;
  }

  for (const item of bharthiTypes) {
    const bharthi = String(
      item.bharthi ?? ""
    ).trim();

    /**
     * Ignore completely empty rows.
     */
    if (!bharthi) {
      continue;
    }

    const stock = Number(item.stock);

    /**
     * Generate child ID.
     */
    const id =
      `GBT-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

    console.log(
      "Inserting Bharthi:",
      {
        id,
        gunnyBagId,
        bharthi,
        stock,
      }
    );

    /**
     * IMPORTANT:
     *
     * Do NOT insert bharthi_code.
     *
     * Your current table has:
     *
     * id
     * gunny_bag_id
     * bharthi
     * stock
     * created_at
     */
    await client.query(
      `
        INSERT INTO gunny_bag_bharthi_types
        (
          id,
          gunny_bag_id,
          bharthi,
          stock,
          created_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          CURRENT_DATE
        )
      `,
      [
        id,
        gunnyBagId,
        bharthi,
        Number.isNaN(stock) ? 0 : stock,
      ]
    );
  }
}

/**
 * ============================================================
 * Get Bharthi Types For Gunny Bag
 * ============================================================
 */
export async function getGunnyBagBharthiTypesRepo(
  gunnyBagId: string
): Promise<GunnyBagBharthiType[]> {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        gunny_bag_id,
        bharthi,
        stock,
        created_at
      FROM gunny_bag_bharthi_types
      WHERE gunny_bag_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [gunnyBagId]
  );

  return rows;
}

/**
 * ============================================================
 * Create Gunny Bag
 * ============================================================
 */
export async function createGunnyBagRepo(
  payload: GunnyBagCreateDTO
): Promise<GunnyBag | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * Generate Gunny Bag ID.
     */
    const id =
      payload.id ||
      `GB-${Date.now()}`;

    /**
     * Generate code when required.
     */
    const code =
      payload.code?.trim() ||
      (await getNextGunnyBagCodeRepo());

    /**
     * Insert parent.
     */
    const { rows } = await client.query(
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
          $9,
          CURRENT_DATE
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
        payload.organization_id ?? null,
        payload.branch_id ?? null,
      ]
    );

    const gunnyBag = rows[0];

    /**
     * Insert Bharthi child records.
     */
    await insertBharthiTypes(
      client,
      id,
      payload.bharthi_types
    );

    /**
     * Commit parent + children together.
     */
    await client.query("COMMIT");

    /**
     * Fetch children after commit.
     *
     * This uses the pool connection because
     * the transaction has already committed.
     */
    const bharthiTypes =
      await getGunnyBagBharthiTypesRepo(id);

    return {
      ...gunnyBag,
      bharthi_types: bharthiTypes,
    };
  } catch (error) {
    console.error(
      "createGunnyBagRepo error:",
      error
    );

    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback error.
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * ============================================================
 * List Gunny Bags
 * ============================================================
 */
export async function listGunnyBagsRepo(organizationId?: string | null, branchId?: string | null): Promise<GunnyBag[]> {
  const params: string[] = [];
  const conditions: string[] = [];

  if (organizationId) {
    params.push(organizationId);
    conditions.push(`(gb.organization_id = $${params.length} OR gb.organization_id IS NULL)`);
  }

  if (branchId) {
    params.push(branchId);
    conditions.push(`(gb.branch_id = $${params.length} OR gb.branch_id IS NULL)`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(`
    SELECT
      gb.*,

      COALESCE(
        json_agg(
          json_build_object(
            'id', bt.id,
            'gunny_bag_id', bt.gunny_bag_id,
            'bharthi', bt.bharthi,
            'stock', bt.stock,
            'created_at', bt.created_at
          )
          ORDER BY
            bt.created_at ASC,
            bt.id ASC
        )
        FILTER (
          WHERE bt.id IS NOT NULL
        ),
        '[]'::json
      ) AS bharthi_types

    FROM gunny_bags gb

    LEFT JOIN gunny_bag_bharthi_types bt
      ON bt.gunny_bag_id = gb.id

    ${where}

    GROUP BY gb.id

    ORDER BY gb.created_at DESC
  `, params);

  return rows;
}

/**
 * ============================================================
 * Get Gunny Bag By ID
 * ============================================================
 */
export async function getGunnyBagByIdRepo(
  id: string
): Promise<GunnyBag | null> {
  const { rows } = await pool.query(
    `
      SELECT
        gb.*,

        COALESCE(
          json_agg(
            json_build_object(
              'id', bt.id,
              'gunny_bag_id', bt.gunny_bag_id,
              'bharthi', bt.bharthi,
              'stock', bt.stock,
              'created_at', bt.created_at
            )
            ORDER BY
              bt.created_at ASC,
              bt.id ASC
          )
          FILTER (
            WHERE bt.id IS NOT NULL
          ),
          '[]'::json
        ) AS bharthi_types

      FROM gunny_bags gb

      LEFT JOIN gunny_bag_bharthi_types bt
        ON bt.gunny_bag_id = gb.id

      WHERE gb.id = $1

      GROUP BY gb.id
    `,
    [id]
  );

  return rows[0] ?? null;
}

/**
 * ============================================================
 * Update Gunny Bag
 * ============================================================
 */
export async function updateGunnyBagRepo(
  id: string,
  payload: GunnyBagCreateDTO
): Promise<GunnyBag | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * Update parent.
     */
    const { rows } = await client.query(
      `
        UPDATE gunny_bags
        SET
          code = $2,
          name = $3,
          size = $4,
          rate_per_bag = $5,
          opening_stock = $6,
          status = $7
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        payload.code,
        payload.name,
        payload.size ?? "",
        payload.rate_per_bag ?? 0,
        payload.opening_stock ?? 0,
        payload.status ?? "Active",
      ]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    /**
     * Remove old Bharthi records.
     */
    await client.query(
      `
        DELETE FROM gunny_bag_bharthi_types
        WHERE gunny_bag_id = $1
      `,
      [id]
    );

    /**
     * Insert current Bharthi records.
     */
    await insertBharthiTypes(
      client,
      id,
      payload.bharthi_types
    );

    await client.query("COMMIT");

    return await getGunnyBagByIdRepo(id);
  } catch (error) {
    console.error(
      "updateGunnyBagRepo error:",
      error
    );

    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback error.
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * ============================================================
 * Delete Gunny Bag
 * ============================================================
 */
export async function deleteGunnyBagRepo(
  id: string
): Promise<{ message: string }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * Children are automatically deleted
     * because the FK uses ON DELETE CASCADE.
     *
     * Explicit delete is still safe.
     */
    await client.query(
      `
        DELETE FROM gunny_bag_bharthi_types
        WHERE gunny_bag_id = $1
      `,
      [id]
    );

    /**
     * Delete parent.
     */
    const result = await client.query(
      `
        DELETE FROM gunny_bags
        WHERE id = $1
        RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");

      throw new Error(
        "Gunny Bag not found"
      );
    }

    await client.query("COMMIT");

    return {
      message:
        "Gunny Bag deleted successfully",
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback error.
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * ============================================================
 * Check Gunny Bag Usage
 * ============================================================
 */
export async function checkGunnyBagUsageRepo(
  id: string
): Promise<string[]> {
  const usedIn: string[] = [];

  /**
   * Add future module checks here.
   */

  return usedIn;
}