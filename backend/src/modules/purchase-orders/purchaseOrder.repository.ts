/**
 * @file purchaseOrder.repository.ts
 * @description Database operations for Purchase Order module (organization-scoped).
 */

import { pool } from "../../config/db.js";
import {
  PurchaseOrderCreateDTO,
  PurchaseOrderRow,
  PurchaseOrderUpdateDTO,
} from "./purchaseOrder.types.js";

const PO_SELECT = `
  SELECT
    po.id,
    po.po_number AS "poNumber",
    po.organization_id AS "organizationId",
    po.supplier_id AS "supplierId",
    po.branch_id AS "branchId",
    po.warehouse_id AS "warehouseId",
    po.po_date AS "date",
    po.remarks,
    po.status,
    po.purchase_order_invoice_status AS "purchaseOrderInvoiceStatus",
    po.mode,
    COALESCE(
      json_agg(
        json_build_object(
          'id', poi.id,
          'itemId', poi.item_id,
          'quantity', poi.quantity,
          'discount', poi.discount,
          'actualQuantity', poi.actual_quantity,
          'purchaseCost', poi.purchase_cost,
          'purchaseAmount', poi.purchase_amount,
          'amount', poi.amount,
          'rate', poi.rate
        ) ORDER BY poi.created_at
      ) FILTER (WHERE poi.id IS NOT NULL),
      '[]'
    ) AS lines
  FROM purchase_orders po
  LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
`;

export async function listPurchaseOrdersRepo(
  organizationId?: string | null
): Promise<PurchaseOrderRow[]> {
  const params: string[] = [];
  let where = "";
  if (organizationId) {
    params.push(organizationId);
    where = "WHERE po.organization_id = $1 OR po.organization_id IS NULL";
  }
  const { rows } = await pool.query(
    `${PO_SELECT} ${where} GROUP BY po.id ORDER BY po.created_at DESC`,
    params
  );
  return rows;
}

export async function getPurchaseOrderByIdRepo(
  id: string
): Promise<PurchaseOrderRow | null> {
  const { rows } = await pool.query(
    `${PO_SELECT} WHERE po.id = $1 GROUP BY po.id`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createPurchaseOrderRepo(
  payload: PurchaseOrderCreateDTO
): Promise<PurchaseOrderRow> {
  const id = payload.id || `PO-${Date.now()}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO purchase_orders
        (id, po_number, organization_id, supplier_id, branch_id, warehouse_id, po_date, remarks, status, mode)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        payload.poNumber,
        payload.organizationId ?? null,
        payload.supplierId,
        payload.branchId ?? null,
        payload.warehouseId ?? "",
        payload.date ?? "",
        payload.remarks ?? "",
        payload.status ?? "Draft",
        payload.mode ?? "tonage",
      ]
    );
    for (const [i, l] of (payload.lines || []).entries()) {
      await client.query(
        `INSERT INTO purchase_order_items
          (id, purchase_order_id, item_id, quantity, discount, actual_quantity, purchase_cost, purchase_amount, amount, rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          `POL-${Date.now()}-${i}`,
          id,
          l.itemId,
          l.quantity ?? 0,
          l.discount ?? 0,
          l.actualQuantity ?? 0,
          l.purchaseCost ?? 0,
          l.purchaseAmount ?? 0,
          l.amount ?? 0,
          l.rate ?? null,
        ]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  const created = await getPurchaseOrderByIdRepo(id);
  return created!;
}

export async function updatePurchaseOrderRepo(
  id: string,
  payload: PurchaseOrderUpdateDTO
): Promise<PurchaseOrderRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE purchase_orders SET
        po_number = COALESCE($2, po_number),
        supplier_id = COALESCE($3, supplier_id),
        branch_id = COALESCE($4, branch_id),
        warehouse_id = COALESCE($5, warehouse_id),
        po_date = COALESCE($6, po_date),
        remarks = COALESCE($7, remarks),
        status = COALESCE($8, status),
        mode = COALESCE($9, mode),
        purchase_order_invoice_status = COALESCE($10, purchase_order_invoice_status)
       WHERE id = $1`,
      [
        id,
        payload.poNumber,
        payload.supplierId,
        payload.branchId,
        payload.warehouseId,
        payload.date,
        payload.remarks,
        payload.status,
        payload.mode,
        payload.purchaseOrderInvoiceStatus,
      ]
    );
    if (payload.lines !== undefined) {
      await client.query(
        "DELETE FROM purchase_order_items WHERE purchase_order_id = $1",
        [id]
      );
      for (const [i, l] of payload.lines.entries()) {
        await client.query(
          `INSERT INTO purchase_order_items
            (id, purchase_order_id, item_id, quantity, discount, actual_quantity, purchase_cost, purchase_amount, amount, rate)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            `POL-${Date.now()}-${i}`,
            id,
            l.itemId,
            l.quantity ?? 0,
            l.discount ?? 0,
            l.actualQuantity ?? 0,
            l.purchaseCost ?? 0,
            l.purchaseAmount ?? 0,
            l.amount ?? 0,
            l.rate ?? null,
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
  const updated = await getPurchaseOrderByIdRepo(id);
  return updated!;
}

export async function deletePurchaseOrderRepo(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM purchase_orders WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
