/**
 * @file salesOrder.repository.ts
 * @description Database operations for Sales Order module (organization-scoped).
 */

import { pool } from "../../config/db.js";
import {
  SalesOrderCreateDTO,
  SalesOrderRow,
  SalesOrderUpdateDTO,
} from "./salesOrder.types.js";

const SO_SELECT = `
  SELECT
    so.id,
    so.so_number AS "soNumber",
    so.organization_id AS "organizationId",
    so.customer_id AS "customerId",
    so.so_date AS "date",
    so.remarks,
    so.source_po_id AS "sourcePOId",
    so.po_number AS "poNumber",
    so.mode,
    so.status,
    so.total_amount AS "totalAmount",
    COALESCE(
      json_agg(
        json_build_object(
          'id', soi.id,
          'itemId', soi.item_id,
          'quantity', soi.quantity,
          'discount', soi.discount,
          'actualQuantity', soi.actual_quantity,
          'saleCost', soi.sale_cost,
          'saleAmount', soi.sale_amount,
          'amount', soi.amount
        ) ORDER BY soi.created_at
      ) FILTER (WHERE soi.id IS NOT NULL),
      '[]'
    ) AS lines
  FROM sales_orders so
  LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
`;

export async function listSalesOrdersRepo(
  organizationId?: string | null
): Promise<SalesOrderRow[]> {
  const params: string[] = [];
  let where = "";
  if (organizationId) {
    params.push(organizationId);
    where = "WHERE so.organization_id = $1 OR so.organization_id IS NULL";
  }
  const { rows } = await pool.query(
    `${SO_SELECT} ${where} GROUP BY so.id ORDER BY so.created_at DESC`,
    params
  );
  return rows;
}

export async function getSalesOrderByIdRepo(
  id: string
): Promise<SalesOrderRow | null> {
  const { rows } = await pool.query(
    `${SO_SELECT} WHERE so.id = $1 GROUP BY so.id`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createSalesOrderRepo(
  payload: SalesOrderCreateDTO
): Promise<SalesOrderRow> {
  const id = payload.id || `SO-${Date.now()}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO sales_orders
        (id, so_number, organization_id, customer_id, so_date, remarks, source_po_id, po_number, mode, status, total_amount)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        payload.soNumber,
        payload.organizationId ?? null,
        payload.customerId ?? "",
        payload.date ?? "",
        payload.remarks ?? "",
        payload.sourcePOId ?? "",
        payload.poNumber ?? "",
        payload.mode ?? "tonage",
        payload.status ?? "Draft",
        payload.totalAmount ?? 0,
      ]
    );
    for (const [i, l] of (payload.lines || []).entries()) {
      await client.query(
        `INSERT INTO sales_order_items
          (id, sales_order_id, item_id, quantity, discount, actual_quantity, sale_cost, sale_amount, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          `SOL-${Date.now()}-${i}`,
          id,
          l.itemId,
          l.quantity ?? 0,
          l.discount ?? 0,
          l.actualQuantity ?? 0,
          l.saleCost ?? 0,
          l.saleAmount ?? 0,
          l.amount ?? 0,
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
  const created = await getSalesOrderByIdRepo(id);
  return created!;
}

export async function updateSalesOrderRepo(
  id: string,
  payload: SalesOrderUpdateDTO
): Promise<SalesOrderRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE sales_orders SET
        so_number = COALESCE($2, so_number),
        customer_id = COALESCE($3, customer_id),
        so_date = COALESCE($4, so_date),
        remarks = COALESCE($5, remarks),
        source_po_id = COALESCE($6, source_po_id),
        po_number = COALESCE($7, po_number),
        mode = COALESCE($8, mode),
        status = COALESCE($9, status),
        total_amount = COALESCE($10, total_amount)
       WHERE id = $1`,
      [
        id,
        payload.soNumber,
        payload.customerId,
        payload.date,
        payload.remarks,
        payload.sourcePOId,
        payload.poNumber,
        payload.mode,
        payload.status,
        payload.totalAmount,
      ]
    );
    if (payload.lines !== undefined) {
      await client.query(
        "DELETE FROM sales_order_items WHERE sales_order_id = $1",
        [id]
      );
      for (const [i, l] of payload.lines.entries()) {
        await client.query(
          `INSERT INTO sales_order_items
            (id, sales_order_id, item_id, quantity, discount, actual_quantity, sale_cost, sale_amount, amount)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            `SOL-${Date.now()}-${i}`,
            id,
            l.itemId,
            l.quantity ?? 0,
            l.discount ?? 0,
            l.actualQuantity ?? 0,
            l.saleCost ?? 0,
            l.saleAmount ?? 0,
            l.amount ?? 0,
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
  const updated = await getSalesOrderByIdRepo(id);
  return updated!;
}

export async function deleteSalesOrderRepo(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM sales_orders WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
