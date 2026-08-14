/**
 * @file bagpurchase.repository.ts
 * @description Database repository for Bag Purchase module.
 */

import { randomUUID } from "crypto";

import { pool } from "../../config/db.js";

import type {
  BagPurchaseCreatePayload,
  BagPurchaseLineResponse,
  BagPurchaseResponse,
} from "./bagpurchase.types.js";

/**
 * ============================================================
 * Database Row Types
 * ============================================================
 */

interface BagPurchaseDbRow {
  id: string;
  purchase_no: string;
  purchase_date: string;
  supplier_id: string | null;
  supplier_code?: string | null;
  supplier_name?: string | null;
  remarks?: string | null;
  total_amount: number | string | null;
  created_at: string;
}
interface BagPurchaseLineDbRow {
  id: string;

  purchase_id: string;

  bag_type_id: string;

  gunny_bag_id?: string | null;

  gunny_bag_code?: string | null;

  gunny_bag_name?: string | null;

  bag_code?: string | null;

  bag_name?: string | null;

  bharthi?: number | string | null;

  quantity: number | string | null;

  rate: number | string | null;

  amount: number | string | null;
}
/**
 * ============================================================
 * Helpers
 * ============================================================
 */

/**
 * Convert a bharthi value from the database into the numeric
 * value expected by BagPurchaseLineResponse.
 *
 * Database examples:
 *   "120"          -> 120
 *   "150"          -> 150
 *   "120-Bharthi"  -> 120
 *   "150-Bharthi"  -> 150
 *
 * Empty / invalid values return null.
 */
function parseBharthi(
  value: string | number | null | undefined
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const text = String(value).trim();

  const match =
    text.match(
      /^\s*(\d+(?:\.\d+)?)/
    );

  if (!match) {
    return null;
  }

  const parsed =
    Number(match[1]);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

/**
 * Convert the frontend bharthi value into the TEXT value
 * required by the database.
 *
 * Examples:
 *   120            -> "120"
 *   "120"          -> "120"
 *   "120-Bharthi"  -> "120-Bharthi"
 */
function normalizeBharthiForDb(
  value:
    | number
    | string
    | null
    | undefined
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return String(value).trim();
}

/**
 * Safely convert a numeric database/frontend value.
 */
function toNumber(
  value:
    | number
    | string
    | null
    | undefined
): number {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

/**
 * ============================================================
 * Get Next Purchase Number
 * ============================================================
 *
 * Format:
 *
 * BP-001
 * BP-002
 * BP-003
 *
 * ============================================================
 */
export async function getNextBagPurchaseNoRepo(): Promise<string> {
  const result =
    await pool.query<{
      purchase_no: string | null;
    }>(
      `
        SELECT purchase_no
        FROM bag_purchases
        ORDER BY
          created_at DESC,
          purchase_no DESC
        LIMIT 1
      `
    );

  if (
    !result.rows.length ||
    !result.rows[0]?.purchase_no
  ) {
    return "BP-001";
  }

  const lastPurchaseNo =
    String(
      result.rows[0].purchase_no
    );

  const match =
    lastPurchaseNo.match(
      /(\d+)$/
    );

  const lastNumber =
    match
      ? Number(match[1])
      : 0;

  const nextNumber =
    lastNumber + 1;

  return `BP-${String(
    nextNumber
  ).padStart(3, "0")}`;
}

/**
 * ============================================================
 * Get Purchase Lines
 * ============================================================
 *
 * bag_purchase_lines.bag_type_id
 *            ↓
 *       gunny_bags.id
 *
 * This gives us the Gunny Bag code and name.
 *
 * ============================================================
 */
async function getPurchaseLines(
  purchaseId: string
): Promise<BagPurchaseLineResponse[]> {
  const result =
    await pool.query<BagPurchaseLineDbRow>(
      `
        SELECT
          bpl.id,
          bpl.purchase_id,

          bpl.bag_type_id
            AS gunny_bag_id,

          gb.code
            AS gunny_bag_code,

          gb.name
            AS gunny_bag_name,

          bpl.bharthi,
          bpl.quantity,
          bpl.rate,
          bpl.amount

        FROM bag_purchase_lines bpl

        LEFT JOIN gunny_bags gb
          ON gb.id = bpl.bag_type_id

        WHERE bpl.purchase_id = $1

        ORDER BY bpl.id ASC
      `,
      [purchaseId]
    );

  return result.rows.map(
    (
      line: BagPurchaseLineDbRow
    ): BagPurchaseLineResponse => ({
      id: line.id,

      purchase_id:
        line.purchase_id,

      gunny_bag_id:
        line.gunny_bag_id ??
        getGunnyBagId(line),

      gunny_bag_code:
        line.gunny_bag_code ??
        line.bag_code ??
        null,

      gunny_bag_name:
        line.gunny_bag_name ??
        line.bag_name ??
        null,

      bharthi:
        line.bharthi !== null &&
        line.bharthi !== undefined
          ? Number(line.bharthi)
          : null,

      quantity:
        Number(
          line.quantity ?? 0
        ),

      rate:
        Number(
          line.rate ?? 0
        ),

      amount:
        Number(
          line.amount ?? 0
        ),

      /**
       * Backward-compatible fields.
       */
      bag_type_id:
        line.bag_type_id,

      bag_code:
        line.gunny_bag_code ??
        line.bag_code ??
        null,

      bag_name:
        line.gunny_bag_name ??
        line.bag_name ??
        null,
    })
  );
}
/**
 * ============================================================
 * Map Purchase Database Row
 * ============================================================
 */
function mapPurchase(
  purchase: BagPurchaseDbRow,
  lines: BagPurchaseLineResponse[]
): BagPurchaseResponse {
  return {
    id: purchase.id,

    purchase_no:
      purchase.purchase_no,

    purchase_date:
      purchase.purchase_date,

    supplier_id:
      purchase.supplier_id ?? "",

    supplier_code:
      purchase.supplier_code ?? null,

    supplier_name:
      purchase.supplier_name ?? null,

    remarks:
      purchase.remarks ?? null,

    total_amount:
      toNumber(
        purchase.total_amount
      ),
      

    created_at:
      purchase.created_at,

    lines,
  };
}

/**
 * ============================================================
 * Resolve Gunny Bag ID
 * ============================================================
 *
 * API uses:
 *     gunny_bag_id
 *
 * Database uses:
 *     bag_type_id
 *
 * Supports both names for backward compatibility.
 * ============================================================
 */
function getGunnyBagId(
  line: {
    gunny_bag_id?: string | null;
    bag_type_id?: string | null;
  }
): string {
  const gunnyBagId =
    line.gunny_bag_id ??
    line.bag_type_id;

  return String(
    gunnyBagId ?? ""
  ).trim();


}
/**
 * ============================================================
 * Get All Bag Purchases
 * ============================================================
 */
export async function getBagPurchasesRepo(organizationId?: string | null, branchId?: string | null): Promise<
  BagPurchaseResponse[]
> {
  const params: string[] = [];
  const conditions: string[] = [];

  if (organizationId) {
    params.push(organizationId);
    conditions.push(`(bp.organization_id = $${params.length} OR bp.organization_id IS NULL)`);
  }

  if (branchId) {
    params.push(branchId);
    conditions.push(`(bp.branch_id = $${params.length} OR bp.branch_id IS NULL)`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result =
    await pool.query<BagPurchaseDbRow>(
      `
        SELECT
          bp.id,
          bp.purchase_no,
          bp.purchase_date,
          bp.supplier_id,

          s.code AS supplier_code,
          s.name AS supplier_name,

          bp.remarks,
          bp.total_amount,
          bp.created_at

        FROM bag_purchases bp

        LEFT JOIN suppliers s
          ON s.id = bp.supplier_id

        ${where}

        ORDER BY
          bp.created_at DESC,
          bp.purchase_no DESC
      `,
      params
    );

  const purchases =
    await Promise.all(
      result.rows.map(
        async (
          purchase: BagPurchaseDbRow
        ) => {
          const lines =
            await getPurchaseLines(
              purchase.id
            );

          return mapPurchase(
            purchase,
            lines
          );
        }
      )
    );

  return purchases;
}

/**
 * ============================================================
 * Get Single Bag Purchase
 * ============================================================
 */
export async function getBagPurchaseRepo(
  id: string
): Promise<BagPurchaseResponse | null> {
  const result =
    await pool.query<BagPurchaseDbRow>(
      `
        SELECT
          bp.id,
          bp.purchase_no,
          bp.purchase_date,
          bp.supplier_id,

          s.code AS supplier_code,
          s.name AS supplier_name,

          bp.remarks,
          bp.total_amount,
          bp.created_at

        FROM bag_purchases bp

        LEFT JOIN suppliers s
          ON s.id = bp.supplier_id

        WHERE bp.id = $1

        LIMIT 1
      `,
      [id]
    );

  if (!result.rows.length) {
    return null;
  }

  const purchase =
    result.rows[0];

  const lines =
    await getPurchaseLines(
      purchase.id
    );

  return mapPurchase(
    purchase,
    lines
  );
}
/**
 * ============================================================
 * Increase Gunny Bag stock
 * ============================================================
 *
 * opening_stock += quantity
 *
 * Also updates the corresponding Bharthi stock.
 */
/**
 * ============================================================
 * Increase Gunny Bag Stock
 * ============================================================
 *
 * Example:
 *
 * Existing:
 *   opening_stock = 100
 *
 *   120-Bharthi = 60
 *   150-Bharthi = 40
 *
 * Purchase:
 *   120 = 30
 *   150 = 40
 *
 * Result:
 *   opening_stock = 170
 *   120-Bharthi = 90
 *   150-Bharthi = 80
 *
 * Bharthi matching supports:
 *   120
 *   "120"
 *   "120-Bharthi"
 */
async function increaseGunnyBagStock(
  client: any,
  gunnyBagId: string,
  bharthi: number | string | null | undefined,
  quantity: number
): Promise<void> {
  if (!gunnyBagId) {
    throw new Error(
      "Gunny Bag ID is required for stock update"
    );
  }

  if (quantity <= 0) {
    return;
  }

  /**
   * ------------------------------------------------------------
   * Lock Gunny Bag row
   * ------------------------------------------------------------
   */
  const bagResult = await client.query(
    `
      SELECT
        id,
        code,
        name,
        opening_stock
      FROM gunny_bags
      WHERE id = $1
      FOR UPDATE
    `,
    [gunnyBagId]
  );

  if (!bagResult.rows.length) {
    throw new Error(
      `Gunny Bag not found: ${gunnyBagId}`
    );
  }

  /**
   * ------------------------------------------------------------
   * Increase overall opening stock
   * ------------------------------------------------------------
   */
  await client.query(
    `
      UPDATE gunny_bags
      SET opening_stock =
        COALESCE(opening_stock, 0) + $1
      WHERE id = $2
    `,
    [
      quantity,
      gunnyBagId,
    ]
  );

  /**
   * ------------------------------------------------------------
   * No Bharthi selected
   * ------------------------------------------------------------
   *
   * Overall stock is still updated.
   */
  if (
    bharthi === null ||
    bharthi === undefined ||
    String(bharthi).trim() === ""
  ) {
    return;
  }

  /**
   * ------------------------------------------------------------
   * Normalize Bharthi
   * ------------------------------------------------------------
   *
   * Supports:
   *
   * 120
   * "120"
   * "120-Bharthi"
   *
   * All become:
   *
   * 120
   */
  const bharthiValue = parseBharthi(bharthi);

  if (bharthiValue === null) {
    throw new Error(
      `Invalid Bharthi value: ${bharthi}`
    );
  }

  /**
   * ------------------------------------------------------------
   * Find matching Bharthi row
   * ------------------------------------------------------------
   *
   * Database may contain:
   *
   * 120
   * 120-Bharthi
   *
   * We compare only the numeric portion.
   * ------------------------------------------------------------
   */
  const bharthiResult = await client.query(
    `
      SELECT
        id,
        bharthi,
        stock
      FROM gunny_bag_bharthi_types
      WHERE gunny_bag_id = $1
        AND NULLIF(
          regexp_replace(
            TRIM(bharthi),
            '[^0-9.].*$',
            '',
            'g'
          ),
          ''
        )::numeric = $2
      FOR UPDATE
    `,
    [
      gunnyBagId,
      bharthiValue,
    ]
  );

  if (!bharthiResult.rows.length) {
    throw new Error(
      `Bharthi ${bharthiValue} is not configured for Gunny Bag ${gunnyBagId}`
    );
  }

  /**
   * ------------------------------------------------------------
   * Increase Bharthi-specific stock
   * ------------------------------------------------------------
   */
  await client.query(
    `
      UPDATE gunny_bag_bharthi_types
      SET stock =
        COALESCE(stock, 0) + $1
      WHERE id = $2
    `,
    [
      quantity,
      bharthiResult.rows[0].id,
    ]
  );
}

/**
 * ============================================================
 * Decrease Gunny Bag stock
 * ============================================================
 *
 * Used when:
 *
 * 1. Existing purchase is edited
 * 2. Purchase is deleted
 */
/**
 * ============================================================
 * Decrease Gunny Bag Stock
 * ============================================================
 *
 * Used for:
 *
 * 1. Editing an existing purchase
 * 2. Deleting a purchase
 *
 * Example:
 *
 * Current:
 *   opening_stock = 170
 *   120-Bharthi = 90
 *   150-Bharthi = 80
 *
 * Old purchase:
 *   120 = 30
 *   150 = 40
 *
 * After reverse:
 *   opening_stock = 100
 *   120-Bharthi = 60
 *   150-Bharthi = 40
 */
async function decreaseGunnyBagStock(
  client: any,
  gunnyBagId: string,
  bharthi: number | string | null | undefined,
  quantity: number
): Promise<void> {
  if (!gunnyBagId) {
    throw new Error(
      "Gunny Bag ID is required for stock update"
    );
  }

  if (quantity <= 0) {
    return;
  }

  /**
   * ------------------------------------------------------------
   * Lock Gunny Bag row
   * ------------------------------------------------------------
   */
  const bagResult = await client.query(
    `
      SELECT
        id,
        opening_stock
      FROM gunny_bags
      WHERE id = $1
      FOR UPDATE
    `,
    [gunnyBagId]
  );

  if (!bagResult.rows.length) {
    throw new Error(
      `Gunny Bag not found: ${gunnyBagId}`
    );
  }

  const currentStock =
    Number(
      bagResult.rows[0].opening_stock ?? 0
    );

  if (currentStock < quantity) {
    throw new Error(
      `Insufficient stock for Gunny Bag ${gunnyBagId}`
    );
  }

  /**
   * ------------------------------------------------------------
   * Decrease overall stock
   * ------------------------------------------------------------
   */
  await client.query(
    `
      UPDATE gunny_bags
      SET opening_stock =
        COALESCE(opening_stock, 0) - $1
      WHERE id = $2
    `,
    [
      quantity,
      gunnyBagId,
    ]
  );

  /**
   * ------------------------------------------------------------
   * No Bharthi selected
   * ------------------------------------------------------------
   */
  if (
    bharthi === null ||
    bharthi === undefined ||
    String(bharthi).trim() === ""
  ) {
    return;
  }

  /**
   * ------------------------------------------------------------
   * Normalize Bharthi
   * ------------------------------------------------------------
   */
  const bharthiValue =
    parseBharthi(bharthi);

  if (bharthiValue === null) {
    throw new Error(
      `Invalid Bharthi value: ${bharthi}`
    );
  }

  /**
   * ------------------------------------------------------------
   * Find matching Bharthi
   * ------------------------------------------------------------
   *
   * Supports:
   *
   * 120
   * 120-Bharthi
   */
  const bharthiResult = await client.query(
    `
      SELECT
        id,
        bharthi,
        stock
      FROM gunny_bag_bharthi_types
      WHERE gunny_bag_id = $1
        AND NULLIF(
          regexp_replace(
            TRIM(bharthi),
            '[^0-9.].*$',
            '',
            'g'
          ),
          ''
        )::numeric = $2
      FOR UPDATE
    `,
    [
      gunnyBagId,
      bharthiValue,
    ]
  );

  if (!bharthiResult.rows.length) {
    throw new Error(
      `Bharthi ${bharthiValue} is not configured for Gunny Bag ${gunnyBagId}`
    );
  }

  const currentBharthiStock =
    Number(
      bharthiResult.rows[0].stock ?? 0
    );

  if (currentBharthiStock < quantity) {
    throw new Error(
      `Insufficient Bharthi ${bharthiValue} stock for Gunny Bag ${gunnyBagId}`
    );
  }

  /**
   * ------------------------------------------------------------
   * Decrease Bharthi-specific stock
   * ------------------------------------------------------------
   */
  await client.query(
    `
      UPDATE gunny_bag_bharthi_types
      SET stock =
        COALESCE(stock, 0) - $1
      WHERE id = $2
    `,
    [
      quantity,
      bharthiResult.rows[0].id,
    ]
  );
}
/**
 * ============================================================
 * Create Bag Purchase
 * ============================================================
 */
export async function createBagPurchaseRepo(
  purchaseNo: string,
  payload: BagPurchaseCreatePayload
): Promise<BagPurchaseResponse | null> {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const purchaseId =
      randomUUID();

    let totalAmount = 0;

    /**
     * Calculate total amount.
     */
    for (
      const line of payload.lines
    ) {
      const quantity =
        toNumber(
          line.quantity
        );

      const rate =
        toNumber(
          line.rate
        );

      totalAmount +=
        quantity * rate;
    }

    /**
     * Insert purchase header.
     */
    await client.query(
      `
        INSERT INTO bag_purchases (
          id,
          purchase_no,
          purchase_date,
          supplier_id,
          remarks,
          total_amount,
          organization_id,
          branch_id
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8
        )
      `,
      [
        purchaseId,

        purchaseNo,

        payload.purchase_date,

        payload.supplier_id,

        payload.remarks ??
          null,

        totalAmount,

        payload.organization_id ??
          null,

        payload.branch_id ??
          null,
      ]
    );

    /**
     * Insert purchase lines.
     */
    for (
      const line of payload.lines
    ) {
      const lineId =
        randomUUID();

      const quantity =
        toNumber(
          line.quantity
        );

      const rate =
        toNumber(
          line.rate
        );

      const amount =
        quantity * rate;

      /**
       * IMPORTANT:
       *
       * bag_purchase_lines.bharthi
       * is TEXT in PostgreSQL.
       *
       * Therefore DO NOT use Number().
       */
      const bharthi =
        normalizeBharthiForDb(
          line.bharthi
        );

      await client.query(
  `
    INSERT INTO bag_purchase_lines (
      id,
      purchase_id,
      bag_type_id,
      bharthi,
      quantity,
      rate,
      amount
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
  `,
  [
    lineId,

    purchaseId,

    getGunnyBagId(line),

    bharthi,

    quantity,

    rate,

    amount,
  ]
);

await increaseGunnyBagStock(
  client,
  getGunnyBagId(line),
  line.bharthi,
  quantity
);
    }

    await client.query(
      "COMMIT"
    );

    /**
     * Return the newly created purchase.
     */
    return getBagPurchaseRepo(
      purchaseId
    );
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

/**
 * ============================================================
 * Update Bag Purchase
 * ============================================================
 */
export async function updateBagPurchaseRepo(
  id: string,
  payload: BagPurchaseCreatePayload
): Promise<BagPurchaseResponse | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * ============================================================
     * Check whether purchase exists
     * ============================================================
     */
    const existingPurchase =
      await client.query(
        `
          SELECT id
          FROM bag_purchases
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );

    if (!existingPurchase.rows.length) {
      throw new Error(
        "Bag Purchase not found"
      );
    }

    /**
     * ============================================================
     * Get OLD purchase lines
     * ============================================================
     *
     * We need these because their stock must be reversed
     * before applying the new purchase lines.
     */
    const oldLines =
      await client.query<{
        bag_type_id: string | null;
        bharthi: string | number | null;
        quantity: string | number | null;
      }>(
        `
          SELECT
            bag_type_id,
            bharthi,
            quantity
          FROM bag_purchase_lines
          WHERE purchase_id = $1
        `,
        [id]
      );

    /**
     * ============================================================
     * Reverse OLD stock
     * ============================================================
     */
    for (const oldLine of oldLines.rows) {
      await decreaseGunnyBagStock(
        client,
        String(
          oldLine.bag_type_id ?? ""
        ).trim(),
        oldLine.bharthi,
        toNumber(
          oldLine.quantity
        )
      );
    }

    /**
     * ============================================================
     * Calculate NEW total amount
     * ============================================================
     */
    let totalAmount = 0;

    for (const line of payload.lines) {
      const quantity =
        toNumber(line.quantity);

      const rate =
        toNumber(line.rate);

      totalAmount +=
        quantity * rate;
    }

    /**
     * ============================================================
     * Update purchase header
     * ============================================================
     */
    await client.query(
      `
        UPDATE bag_purchases
        SET
          purchase_date = $1,
          supplier_id = $2,
          remarks = $3,
          total_amount = $4
        WHERE id = $5
      `,
      [
        payload.purchase_date,
        payload.supplier_id,
        payload.remarks ?? null,
        totalAmount,
        id,
      ]
    );

    /**
     * ============================================================
     * Delete OLD purchase lines
     * ============================================================
     */
    await client.query(
      `
        DELETE FROM bag_purchase_lines
        WHERE purchase_id = $1
      `,
      [id]
    );

    /**
     * ============================================================
     * Insert NEW purchase lines
     * ============================================================
     */
    for (const line of payload.lines) {
      const lineId =
        randomUUID();

      const gunnyBagId =
        getGunnyBagId(line);

      const quantity =
        toNumber(line.quantity);

      const rate =
        toNumber(line.rate);

      const amount =
        quantity * rate;

      const bharthi =
        normalizeBharthiForDb(
          line.bharthi
        );

      await client.query(
        `
          INSERT INTO bag_purchase_lines (
            id,
            purchase_id,
            bag_type_id,
            bharthi,
            quantity,
            rate,
            amount
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
        `,
        [
          lineId,
          id,
          gunnyBagId,
          bharthi,
          quantity,
          rate,
          amount,
        ]
      );

      /**
       * Apply NEW stock.
       */
      await increaseGunnyBagStock(
        client,
        gunnyBagId,
        line.bharthi,
        quantity
      );
    }

    await client.query("COMMIT");

    return getBagPurchaseRepo(id);
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

/**
 * ============================================================
 * Delete Bag Purchase
 * ============================================================
 */
export async function deleteBagPurchaseRepo(
  id: string
): Promise<{
  message: string;
}> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * ============================================================
     * Check whether purchase exists
     * ============================================================
     */
    const existing =
      await client.query(
        `
          SELECT id
          FROM bag_purchases
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );

    if (!existing.rows.length) {
      throw new Error(
        "Bag Purchase not found"
      );
    }

    /**
     * ============================================================
     * Get purchase lines
     * ============================================================
     */
    const purchaseLines =
      await client.query<{
        bag_type_id: string | null;
        bharthi: string | number | null;
        quantity: string | number | null;
      }>(
        `
          SELECT
            bag_type_id,
            bharthi,
            quantity
          FROM bag_purchase_lines
          WHERE purchase_id = $1
        `,
        [id]
      );

    /**
     * ============================================================
     * Reverse stock
     * ============================================================
     */
    for (
      const line of purchaseLines.rows
    ) {
      await decreaseGunnyBagStock(
        client,
        String(
          line.bag_type_id ?? ""
        ).trim(),
        line.bharthi,
        toNumber(
          line.quantity
        )
      );
    }

    /**
     * ============================================================
     * Delete purchase lines
     * ============================================================
     */
    await client.query(
      `
        DELETE FROM bag_purchase_lines
        WHERE purchase_id = $1
      `,
      [id]
    );

    /**
     * ============================================================
     * Delete purchase header
     * ============================================================
     */
    await client.query(
      `
        DELETE FROM bag_purchases
        WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    return {
      message:
        "Bag Purchase deleted successfully",
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}