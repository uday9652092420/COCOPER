/**
 * @file purchaseInvoice.repository.ts
 * @description Database operations for Purchase Invoice module (organization-scoped).
 */

import { pool } from "../../config/db.js";
import {
  PurchaseInvoiceCreateDTO,
  PurchaseInvoiceRow,
  PurchaseInvoiceUpdateDTO,
} from "./purchaseInvoice.types.js";

const calculateBaseCost = (amount: number, pieces: number): number =>
  pieces > 0 ? Math.round((amount / pieces) * 100) / 100 : 0

let purchaseInvoiceSchemaReady: Promise<void> | null = null;

async function ensurePurchaseInvoiceSchema(): Promise<void> {
  if (!purchaseInvoiceSchemaReady) {
    purchaseInvoiceSchemaReady = pool
      .query(
        `ALTER TABLE purchase_invoice_items
         ADD COLUMN IF NOT EXISTS pieces_percentage NUMERIC DEFAULT 0,
         ADD COLUMN IF NOT EXISTS pieces NUMERIC DEFAULT 0,
         ADD COLUMN IF NOT EXISTS base_cost NUMERIC DEFAULT 0`
      )
      .then(() => undefined)
      .catch((error) => {
        purchaseInvoiceSchemaReady = null;
        throw error;
      });
  }
  await purchaseInvoiceSchemaReady;
}

const PI_SELECT = `
  SELECT
    pi.id,
    TO_CHAR(pi.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
    pi.invoice_no AS "invoiceNo",
    pi.organization_id AS "organizationId",
    pi.supplier_id AS "supplierId",
    pi.branch_id AS "branchId",
    pi.purchase_order_id AS "purchaseOrderId",
    pi.invoice_date AS "invoiceDate",
    pi.mode,
    pi.loading_cost AS "loadingCost",
    pi.market_cess AS "marketCess",
    pi.bags_and_sticks AS "bagsAndSticks",
    pi.freight,
    pi.grand_total AS "grandTotal",
    COALESCE(pi.outstanding_amount, pi.grand_total, 0) AS "outstandingAmount",
    pi.status,
    COALESCE(pi.supplier_payment_receipt_status, false) AS "supplierPaymentReceiptStatus",
    COALESCE(
      json_agg(
        json_build_object(
          'id', pii.id,
          'itemId', pii.item_id,
          'quantityTons', pii.quantity_tons,
          'discount', pii.discount,
          'piecesPercentage', pii.pieces_percentage,
          'pieces', pii.pieces,
          'baseCost', pii.base_cost,
          'actualQuantity', pii.actual_quantity,
          'purchaseCost', pii.purchase_cost,
          'purchaseAmount', pii.purchase_amount
        ) ORDER BY pii.created_at
      ) FILTER (WHERE pii.id IS NOT NULL),
      '[]'
    ) AS lines
  FROM purchase_invoices pi
  LEFT JOIN purchase_invoice_items pii ON pii.purchase_invoice_id = pi.id
`;

type InvoiceStockLine = {
  itemId: string
  pieces: number
  purchaseAmount: number
}

type InvoiceQuantityLine = {
  itemId: string
  quantity: number
}

type StockLedgerLine = {
  itemId: string
  quantity: number
}

function toLedgerDate(value: string): string {
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? "")
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return value
  throw new Error("Invoice date must be a valid date")
}

async function replacePurchaseInvoiceLedger(
  client: import("pg").PoolClient,
  invoiceId: string,
  invoiceNo: string,
  organizationId: string,
  branchId: string,
  invoiceDate: string,
  lines: StockLedgerLine[]
): Promise<void> {
  await client.query(
    "DELETE FROM item_stock_ledger WHERE source_id = $1 AND stock_type = 'Purchase'",
    [invoiceId]
  )
  const quantities = groupInvoiceQuantityLines(lines)
  if (!quantities.size) return

  const itemIds = [...quantities.keys()]
  const rateResult = await client.query(
    `SELECT item_id AS "itemId", base_cost AS "baseCost"
     FROM item_branch_stock
     WHERE organization_id = $1 AND branch_id = $2::uuid AND item_id = ANY($3::text[])`,
    [organizationId, branchId, itemIds]
  )
  const rates = new Map<string, number>(
    rateResult.rows.map((row: { itemId: string; baseCost: number | string }) => [row.itemId, Number(row.baseCost) || 0])
  )

  for (const [itemId, quantity] of quantities) {
    await client.query(
      `INSERT INTO item_stock_ledger
        (id, organization_id, branch_id, item_id, transaction_date,
         in_quantity_stock, out_quantity_stock, rate, stock_type, source_id, source_number)
       VALUES ($1,$2,$3::uuid,$4,$5,$6,NULL,$7,'Purchase',$8,$9)`,
      [
        `ISL-P-${invoiceId}-${itemId}`,
        organizationId,
        branchId,
        itemId,
        toLedgerDate(invoiceDate),
        quantity,
        rates.get(itemId) ?? 0,
        invoiceId,
        invoiceNo,
      ]
    )
  }
}

type InvoiceStockTotals = {
  pieces: number
  purchaseAmount: number
}

function groupInvoiceStockLines(lines: InvoiceStockLine[]): Map<string, InvoiceStockTotals> {
  const totals = new Map<string, InvoiceStockTotals>()
  for (const line of lines) {
    const pieces = Number(line.pieces) || 0
    if (pieces < 0) throw new Error("Pieces cannot be negative")
    if (!line.itemId || pieces <= 0) continue
    const current = totals.get(line.itemId) ?? { pieces: 0, purchaseAmount: 0 }
    current.pieces += pieces
    current.purchaseAmount += Number(line.purchaseAmount) || 0
    totals.set(line.itemId, current)
  }
  return totals
}

async function addInvoicePieceStock(
  client: import("pg").PoolClient,
  organizationId: string,
  branchId: string,
  itemId: string,
  pieces: number,
  baseCost: number
): Promise<void> {
  const itemResult = await client.query(
    `SELECT code FROM items
     WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
    [itemId, organizationId]
  )
  if (!itemResult.rows[0]) throw new Error(`Item not found: ${itemId}`)

  const branchResult = await client.query(
    "SELECT branch_name AS \"branchName\" FROM branches WHERE id = $1",
    [branchId]
  )
  if (!branchResult.rows[0]) throw new Error(`Branch not found: ${branchId}`)

  await client.query(
    `INSERT INTO item_branch_stock
      (id, organization_id, item_id, item_code, branch_id, branch_name, stock, pieces, base_cost)
     VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8)
     ON CONFLICT (organization_id, item_id, branch_id)
     DO UPDATE SET
       pieces = item_branch_stock.pieces + EXCLUDED.pieces,
       base_cost = CASE
         WHEN item_branch_stock.pieces + EXCLUDED.pieces > 0 THEN ROUND(
           (item_branch_stock.pieces * item_branch_stock.base_cost
             + EXCLUDED.pieces * EXCLUDED.base_cost)
           / (item_branch_stock.pieces + EXCLUDED.pieces),
           2
         )
         ELSE EXCLUDED.base_cost
       END,
       item_code = EXCLUDED.item_code,
       branch_name = EXCLUDED.branch_name,
       updated_at = NOW()`,
    [
      `IBS-${Date.now()}-${itemId}-${branchId}`,
      organizationId,
      itemId,
      itemResult.rows[0].code ?? itemId,
      branchId,
      branchResult.rows[0].branchName,
      pieces,
      baseCost,
    ]
  )
}

async function removeInvoicePieceStock(
  client: import("pg").PoolClient,
  organizationId: string,
  branchId: string,
  itemId: string,
  pieces: number
): Promise<void> {
  const result = await client.query(
    `UPDATE item_branch_stock
     SET pieces = pieces - $1, updated_at = NOW()
     WHERE organization_id = $2 AND item_id = $3 AND branch_id = $4 AND pieces >= $1`,
    [pieces, organizationId, itemId, branchId]
  )
  if (result.rowCount !== 1) {
    throw new Error(`Cannot remove ${pieces} pieces of item ${itemId}; piece stock is insufficient`)
  }
}

async function reconcileInvoicePieceStock(
  client: import("pg").PoolClient,
  organizationId: string | null,
  previousBranchId: string | null,
  previousLines: InvoiceStockLine[],
  nextBranchId: string | null,
  nextLines: InvoiceStockLine[]
): Promise<void> {
  if (!organizationId) return
  const previous = groupInvoiceStockLines(previousLines)
  const next = groupInvoiceStockLines(nextLines)

  if (previousBranchId && previousBranchId === nextBranchId) {
    for (const itemId of new Set([...previous.keys(), ...next.keys()])) {
      const before = previous.get(itemId) ?? { pieces: 0, purchaseAmount: 0 }
      const after = next.get(itemId) ?? { pieces: 0, purchaseAmount: 0 }
      const delta = after.pieces - before.pieces
      if (delta > 0 && nextBranchId) {
        const addedAmount = after.purchaseAmount - before.purchaseAmount
        await addInvoicePieceStock(
          client,
          organizationId,
          nextBranchId,
          itemId,
          delta,
          calculateBaseCost(addedAmount, delta)
        )
      } else if (delta < 0) {
        await removeInvoicePieceStock(client, organizationId, previousBranchId, itemId, Math.abs(delta))
      }
    }
    return
  }

  if (previousBranchId) {
    for (const [itemId, totals] of previous) {
      await removeInvoicePieceStock(client, organizationId, previousBranchId, itemId, totals.pieces)
    }
  }
  if (nextBranchId) {
    for (const [itemId, totals] of next) {
      await addInvoicePieceStock(
        client,
        organizationId,
        nextBranchId,
        itemId,
        totals.pieces,
        calculateBaseCost(totals.purchaseAmount, totals.pieces)
      )
    }
  }
}

function groupInvoiceQuantityLines(lines: InvoiceQuantityLine[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const line of lines) {
    const quantity = Number(line.quantity) || 0
    if (quantity < 0) throw new Error("Invoice quantity cannot be negative")
    if (!line.itemId || quantity === 0) continue
    totals.set(line.itemId, (totals.get(line.itemId) ?? 0) + quantity)
  }
  return totals
}

async function addInvoiceQuantityStock(
  client: import("pg").PoolClient,
  organizationId: string,
  branchId: string,
  itemId: string,
  quantity: number
): Promise<void> {
  const itemResult = await client.query(
    `SELECT code FROM items
     WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
    [itemId, organizationId]
  )
  if (!itemResult.rows[0]) throw new Error(`Item not found: ${itemId}`)

  const branchResult = await client.query(
    `SELECT branch_name AS "branchName" FROM branches WHERE id::text = $1`,
    [branchId]
  )
  if (!branchResult.rows[0]) throw new Error(`Branch not found: ${branchId}`)

  await client.query(
    `INSERT INTO item_branch_stock
      (id, organization_id, item_id, item_code, branch_id, branch_name, stock)
     VALUES ($1,$2,$3,$4,$5::uuid,$6,$7)
     ON CONFLICT (organization_id, item_id, branch_id)
     DO UPDATE SET
       stock = item_branch_stock.stock + EXCLUDED.stock,
       item_code = EXCLUDED.item_code,
       branch_name = EXCLUDED.branch_name,
       updated_at = NOW()`,
    [
      `IBS-${Date.now()}-${itemId}-${branchId}`,
      organizationId,
      itemId,
      itemResult.rows[0].code ?? itemId,
      branchId,
      branchResult.rows[0].branchName,
      quantity,
    ]
  )
  await client.query(
    `UPDATE items SET branch_wise_stock = COALESCE(branch_wise_stock, 0) + $1
     WHERE id = $2 AND (organization_id = $3 OR organization_id IS NULL)`,
    [quantity, itemId, organizationId]
  )
}

async function removeInvoiceQuantityStock(
  client: import("pg").PoolClient,
  organizationId: string,
  branchId: string,
  itemId: string,
  quantity: number
): Promise<void> {
  const stockResult = await client.query(
    `UPDATE item_branch_stock
     SET stock = stock - $1, updated_at = NOW()
     WHERE organization_id = $2 AND item_id = $3 AND branch_id = $4::uuid AND stock >= $1`,
    [quantity, organizationId, itemId, branchId]
  )
  if (stockResult.rowCount !== 1) {
    throw new Error(`Cannot remove ${quantity} stock of item ${itemId}; branch stock is insufficient`)
  }

  const itemResult = await client.query(
    `UPDATE items
     SET branch_wise_stock = COALESCE(branch_wise_stock, 0) - $1
     WHERE id = $2 AND (organization_id = $3 OR organization_id IS NULL)
       AND COALESCE(branch_wise_stock, 0) >= $1`,
    [quantity, itemId, organizationId]
  )
  if (itemResult.rowCount !== 1) {
    throw new Error(`Cannot remove ${quantity} stock of item ${itemId}; total item stock is insufficient`)
  }
}

async function reconcileInvoiceQuantityStock(
  client: import("pg").PoolClient,
  organizationId: string | null,
  previousBranchId: string | null,
  previousLines: InvoiceQuantityLine[],
  previousPurchaseOrderId: string | null,
  nextBranchId: string | null,
  nextLines: InvoiceQuantityLine[],
  nextPurchaseOrderId: string | null
): Promise<void> {
  if (!organizationId) return
  const previous = groupInvoiceQuantityLines(previousLines)
  const next = groupInvoiceQuantityLines(nextLines)
  const previousStandalone = !previousPurchaseOrderId
  const nextStandalone = !nextPurchaseOrderId

  if (previousStandalone && nextStandalone && previousBranchId && previousBranchId === nextBranchId) {
    for (const itemId of new Set([...previous.keys(), ...next.keys()])) {
      const delta = (next.get(itemId) ?? 0) - (previous.get(itemId) ?? 0)
      if (delta > 0) await addInvoiceQuantityStock(client, organizationId, nextBranchId, itemId, delta)
      if (delta < 0) await removeInvoiceQuantityStock(client, organizationId, previousBranchId, itemId, Math.abs(delta))
    }
    return
  }

  if (previousStandalone && previousBranchId) {
    for (const [itemId, quantity] of previous) {
      await removeInvoiceQuantityStock(client, organizationId, previousBranchId, itemId, quantity)
    }
  }
  if (nextStandalone && nextBranchId) {
    for (const [itemId, quantity] of next) {
      await addInvoiceQuantityStock(client, organizationId, nextBranchId, itemId, quantity)
    }
  }
}

export async function listPurchaseInvoicesRepo(
  organizationId?: string | null
): Promise<PurchaseInvoiceRow[]> {
  await ensurePurchaseInvoiceSchema();
  const params: string[] = [];
  let where = "";
  if (organizationId) {
    params.push(organizationId);
    where = "WHERE pi.organization_id = $1"
  }
  const { rows } = await pool.query(
    `${PI_SELECT} ${where} GROUP BY pi.id ORDER BY pi.created_at DESC`,
    params
  );
  return rows;
}

export async function getPurchaseInvoiceByIdRepo(
  id: string,
  organizationId?: string | null
): Promise<PurchaseInvoiceRow | null> {
  await ensurePurchaseInvoiceSchema();
  const params: string[] = [id]
  let where = "WHERE pi.id = $1"
  if (organizationId) {
    params.push(organizationId)
    where = `WHERE pi.id = $1 AND pi.organization_id = $2`
  }
  const { rows } = await pool.query(
    `${PI_SELECT} ${where} GROUP BY pi.id`,
    params
  );
  return rows[0] ?? null;
}

export async function createPurchaseInvoiceRepo(
  payload: PurchaseInvoiceCreateDTO
): Promise<PurchaseInvoiceRow> {
  await ensurePurchaseInvoiceSchema();
  if (!payload.organizationId) {
    throw new Error("An organization is required to update purchase invoice stock")
  }
  if (!payload.branchId) {
    throw new Error("A branch is required to update purchase invoice stock")
  }
  const id = payload.id || `PINV-${Date.now()}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO purchase_invoices
        (id, invoice_no, organization_id, supplier_id, branch_id, invoice_date, mode,
        loading_cost, market_cess, bags_and_sticks, freight, grand_total, outstanding_amount,
        supplier_payment_receipt_status, status, purchase_order_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id,
        payload.invoiceNo,
        payload.organizationId ?? null,
        payload.supplierId,
        payload.branchId ?? "",
        payload.invoiceDate ?? "",
        payload.mode ?? "tonage",
        payload.loadingCost ?? 0,
        payload.marketCess ?? 0,
        payload.bagsAndSticks ?? 0,
        payload.freight ?? 0,
        payload.grandTotal ?? 0,
        payload.outstandingAmount ?? payload.grandTotal ?? 0,
        payload.supplierPaymentReceiptStatus ?? true,
        payload.status ?? "Draft",
        payload.purchaseOrderId ?? null,
      ]
    );
    for (const [i, l] of (payload.lines || []).entries()) {
      await client.query(
        `INSERT INTO purchase_invoice_items
          (id, purchase_invoice_id, item_id, quantity_tons, discount, pieces_percentage, pieces, base_cost, actual_quantity, purchase_cost, purchase_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          `PIL-${Date.now()}-${i}`,
          id,
          l.itemId,
          l.quantityTons ?? 0,
          l.discount ?? 0,
          l.piecesPercentage ?? 0,
          l.pieces ?? 0,
          calculateBaseCost(Number(l.purchaseAmount ?? 0), Number(l.pieces ?? 0)),
          l.actualQuantity ?? 0,
          l.purchaseCost ?? 0,
          l.purchaseAmount ?? 0,
        ]
      );
    }
    await reconcileInvoicePieceStock(
      client,
      payload.organizationId ?? null,
      null,
      [],
      payload.branchId || null,
      (payload.lines || []).map((line) => ({
        itemId: line.itemId,
        pieces: Number(line.pieces) || 0,
        purchaseAmount: Number(line.purchaseAmount) || 0,
      }))
    )
    await reconcileInvoiceQuantityStock(
      client,
      payload.organizationId ?? null,
      null,
      [],
      null,
      payload.branchId || null,
      (payload.lines || []).map((line) => ({
        itemId: line.itemId,
        quantity: Number(line.quantityTons) || 0,
      })),
      payload.purchaseOrderId ?? null
    )
    await replacePurchaseInvoiceLedger(
      client,
      id,
      payload.invoiceNo,
      payload.organizationId!,
      payload.branchId!,
      toLedgerDate(payload.invoiceDate ?? ""),
      (payload.lines || []).map((line) => ({
        itemId: line.itemId,
        quantity: Number(line.quantityTons) || 0,
      }))
    )
    if (payload.purchaseOrderId) {
      await client.query(
        `UPDATE purchase_orders SET purchase_order_invoice_status = TRUE, status = 'Invoiced'
         WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
        [payload.purchaseOrderId, payload.organizationId ?? null]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  const created = await getPurchaseInvoiceByIdRepo(id, payload.organizationId);
  return created!;
}

export async function updatePurchaseInvoiceRepo(
  id: string,
  payload: PurchaseInvoiceUpdateDTO,
  organizationId?: string | null
): Promise<PurchaseInvoiceRow> {
  await ensurePurchaseInvoiceSchema();
  const currentInvoice = await getPurchaseInvoiceByIdRepo(id, organizationId ?? null);
  if (!currentInvoice) {
    throw new Error("Purchase invoice not found");
  }

  const resolvedOrganizationId = currentInvoice.organizationId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invoiceHeaderResult = await client.query(
            `SELECT organization_id AS "organizationId", branch_id AS "branchId",
              purchase_order_id AS "purchaseOrderId", invoice_no AS "invoiceNo",
              invoice_date AS "invoiceDate"
       FROM purchase_invoices
       WHERE id = $1 AND ($2::uuid IS NULL OR organization_id = $2)
       FOR UPDATE`,
      [id, resolvedOrganizationId ?? null]
    )
    const invoiceHeader = invoiceHeaderResult.rows[0]
    if (!invoiceHeader) throw new Error("Purchase invoice not found")
    const previousLinesResult = await client.query(
            `SELECT item_id AS "itemId", quantity_tons AS quantity, pieces,
              purchase_amount AS "purchaseAmount"
       FROM purchase_invoice_items
       WHERE purchase_invoice_id = $1
       FOR UPDATE`,
      [id]
    )
    const previousBranchId = invoiceHeader.branchId || null
    const nextBranchId = payload.branchId ?? previousBranchId
    const previousPurchaseOrderId = invoiceHeader.purchaseOrderId || null
    const nextPurchaseOrderId = payload.purchaseOrderId || previousPurchaseOrderId
    const nextInvoiceNo = payload.invoiceNo ?? invoiceHeader.invoiceNo
    const nextInvoiceDate = payload.invoiceDate ?? invoiceHeader.invoiceDate
    const previousStockLines = previousLinesResult.rows as InvoiceStockLine[]
    const previousQuantityLines = previousLinesResult.rows as InvoiceQuantityLine[]
    const nextStockLines = payload.lines?.map((line) => ({
      itemId: line.itemId,
      pieces: Number(line.pieces) || 0,
      purchaseAmount: Number(line.purchaseAmount) || 0,
    })) ?? previousStockLines
    const nextQuantityLines = payload.lines?.map((line) => ({
      itemId: line.itemId,
      quantity: Number(line.quantityTons) || 0,
    })) ?? previousQuantityLines
    await client.query(
      `UPDATE purchase_invoices SET
        invoice_no = COALESCE($2, invoice_no),
        supplier_id = COALESCE($3, supplier_id),
        branch_id = COALESCE($4, branch_id),
        invoice_date = COALESCE($5, invoice_date),
        mode = COALESCE($6, mode),
        loading_cost = COALESCE($7, loading_cost),
        market_cess = COALESCE($8, market_cess),
        bags_and_sticks = COALESCE($9, bags_and_sticks),
        freight = COALESCE($10, freight),
        grand_total = COALESCE($11, grand_total),
        outstanding_amount = COALESCE($12, outstanding_amount),
        status = COALESCE($13, status),
        purchase_order_id = COALESCE($14, purchase_order_id),
        supplier_payment_receipt_status = COALESCE($15, supplier_payment_receipt_status)
             WHERE id = $1 AND ($16::uuid IS NULL OR organization_id = $16)`,
      [
        id,
        payload.invoiceNo,
        payload.supplierId,
        payload.branchId,
        payload.invoiceDate,
        payload.mode,
        payload.loadingCost,
        payload.marketCess,
        payload.bagsAndSticks,
        payload.freight,
        payload.grandTotal,
        payload.outstandingAmount,
        payload.status,
        payload.purchaseOrderId,
        payload.supplierPaymentReceiptStatus,
        resolvedOrganizationId ?? null,
      ]
    );

    const updateResult = await client.query(
      "SELECT id FROM purchase_invoices WHERE id = $1 AND ($2::uuid IS NULL OR organization_id = $2)",
      [id, resolvedOrganizationId ?? null]
    );
    if (updateResult.rowCount === 0) {
      throw new Error("Purchase invoice not found");
    }

    if (payload.lines !== undefined || nextBranchId !== previousBranchId) {
      await reconcileInvoicePieceStock(
        client,
        resolvedOrganizationId ?? null,
        previousBranchId,
        previousStockLines,
        nextBranchId || null,
        nextStockLines
      )
    }

    if (
      payload.lines !== undefined ||
      nextBranchId !== previousBranchId ||
      nextPurchaseOrderId !== previousPurchaseOrderId
    ) {
      await reconcileInvoiceQuantityStock(
        client,
        resolvedOrganizationId ?? null,
        previousBranchId,
        previousQuantityLines,
        previousPurchaseOrderId,
        nextBranchId || null,
        nextQuantityLines,
        nextPurchaseOrderId
      )
    }

    if (
      payload.lines !== undefined ||
      nextBranchId !== previousBranchId ||
      nextInvoiceNo !== invoiceHeader.invoiceNo ||
      nextInvoiceDate !== invoiceHeader.invoiceDate
    ) {
      await replacePurchaseInvoiceLedger(
        client,
        id,
        nextInvoiceNo,
        resolvedOrganizationId!,
        nextBranchId!,
        toLedgerDate(nextInvoiceDate),
        nextQuantityLines
      )
    }

    if (payload.lines !== undefined) {
      await client.query(
        "DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
        [id]
      );
      for (const [i, l] of payload.lines.entries()) {
        await client.query(
          `INSERT INTO purchase_invoice_items
            (id, purchase_invoice_id, item_id, quantity_tons, discount, pieces_percentage, pieces, base_cost, actual_quantity, purchase_cost, purchase_amount)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            `PIL-${Date.now()}-${i}`,
            id,
            l.itemId,
            l.quantityTons ?? 0,
            l.discount ?? 0,
            l.piecesPercentage ?? 0,
            l.pieces ?? 0,
            calculateBaseCost(Number(l.purchaseAmount ?? 0), Number(l.pieces ?? 0)),
            l.actualQuantity ?? 0,
            l.purchaseCost ?? 0,
            l.purchaseAmount ?? 0,
          ]
        );
      }
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const updated = await getPurchaseInvoiceByIdRepo(id, resolvedOrganizationId ?? null);
  return updated!;
}

export async function deletePurchaseInvoiceRepo(
  id: string,
  organizationId?: string | null
): Promise<boolean> {
  await ensurePurchaseInvoiceSchema();
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const invoiceResult = await client.query(
            `SELECT organization_id AS "organizationId", branch_id AS "branchId",
              purchase_order_id AS "purchaseOrderId"
       FROM purchase_invoices
       WHERE id = $1 AND ($2::uuid IS NULL OR organization_id = $2::uuid)
       FOR UPDATE`,
      [id, organizationId ?? null]
    )
    const invoice = invoiceResult.rows[0]
    if (!invoice) {
      await client.query("COMMIT")
      return false
    }
    await client.query(
      "DELETE FROM item_stock_ledger WHERE source_id = $1 AND stock_type = 'Purchase'",
      [id]
    )
    const linesResult = await client.query(
            `SELECT item_id AS "itemId", quantity_tons AS quantity, pieces,
              purchase_amount AS "purchaseAmount"
       FROM purchase_invoice_items
       WHERE purchase_invoice_id = $1
       FOR UPDATE`,
      [id]
    )
    await reconcileInvoicePieceStock(
      client,
      invoice.organizationId ?? null,
      invoice.branchId || null,
      linesResult.rows as InvoiceStockLine[],
      null,
      []
    )
    await reconcileInvoiceQuantityStock(
      client,
      invoice.organizationId ?? null,
      invoice.branchId || null,
      linesResult.rows as InvoiceQuantityLine[],
      invoice.purchaseOrderId || null,
      null,
      [],
      null
    )
    const result = await client.query("DELETE FROM purchase_invoices WHERE id = $1", [id])
    await client.query("COMMIT")
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
