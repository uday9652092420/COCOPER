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

const PI_SELECT = `
  SELECT
    pi.id,
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
    pi.status,
    COALESCE(
      json_agg(
        json_build_object(
          'id', pii.id,
          'itemId', pii.item_id,
          'quantityTons', pii.quantity_tons,
          'discount', pii.discount,
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

export async function listPurchaseInvoicesRepo(
  organizationId?: string | null
): Promise<PurchaseInvoiceRow[]> {
  const params: string[] = [];
  let where = "";
  if (organizationId) {
    params.push(organizationId);
    where = "WHERE pi.organization_id = $1 OR pi.organization_id IS NULL";
  }
  const { rows } = await pool.query(
    `${PI_SELECT} ${where} GROUP BY pi.id ORDER BY pi.created_at DESC`,
    params
  );
  return rows;
}

export async function getPurchaseInvoiceByIdRepo(
  id: string
): Promise<PurchaseInvoiceRow | null> {
  const { rows } = await pool.query(
    `${PI_SELECT} WHERE pi.id = $1 GROUP BY pi.id`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createPurchaseInvoiceRepo(
  payload: PurchaseInvoiceCreateDTO
): Promise<PurchaseInvoiceRow> {
  const id = payload.id || `PINV-${Date.now()}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO purchase_invoices
        (id, invoice_no, organization_id, supplier_id, branch_id, invoice_date, mode,
         loading_cost, market_cess, bags_and_sticks, freight, grand_total, status, purchase_order_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
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
        payload.status ?? "Draft",
        payload.purchaseOrderId ?? null,
      ]
    );
    for (const [i, l] of (payload.lines || []).entries()) {
      await client.query(
        `INSERT INTO purchase_invoice_items
          (id, purchase_invoice_id, item_id, quantity_tons, discount, actual_quantity, purchase_cost, purchase_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          `PIL-${Date.now()}-${i}`,
          id,
          l.itemId,
          l.quantityTons ?? 0,
          l.discount ?? 0,
          l.actualQuantity ?? 0,
          l.purchaseCost ?? 0,
          l.purchaseAmount ?? 0,
        ]
      );
    }
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
  const created = await getPurchaseInvoiceByIdRepo(id);
  return created!;
}

export async function updatePurchaseInvoiceRepo(
  id: string,
  payload: PurchaseInvoiceUpdateDTO
): Promise<PurchaseInvoiceRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
        grand_total = COALESCE($11, grand_total)
        ,status = COALESCE($12, status)
        ,purchase_order_id = COALESCE($13, purchase_order_id)
       WHERE id = $1`,
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
        payload.status,
        payload.purchaseOrderId,
      ]
    );
    if (payload.lines !== undefined) {
      await client.query(
        "DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
        [id]
      );
      for (const [i, l] of payload.lines.entries()) {
        await client.query(
          `INSERT INTO purchase_invoice_items
            (id, purchase_invoice_id, item_id, quantity_tons, discount, actual_quantity, purchase_cost, purchase_amount)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            `PIL-${Date.now()}-${i}`,
            id,
            l.itemId,
            l.quantityTons ?? 0,
            l.discount ?? 0,
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
  const updated = await getPurchaseInvoiceByIdRepo(id);
  return updated!;
}

export async function deletePurchaseInvoiceRepo(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM purchase_invoices WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
