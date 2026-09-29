import { pool } from '../../config/db.js';

export interface ProfitLossStockSnapshot {
  openingUnits: number;
  openingAmount: number;
  closingUnits: number;
  closingAmount: number;
}

export async function getProfitLossStockSnapshot(
  fromDate: string,
  toDate: string,
  organizationId: string | null,
): Promise<ProfitLossStockSnapshot> {
  const { rows } = await pool.query(
    `WITH scoped_ledger AS (
       SELECT organization_id, branch_id, item_id, transaction_date, created_at,
              rate, stock_type,
              COALESCE(in_quantity_stock, 0) - COALESCE(out_quantity_stock, 0) AS net_quantity
       FROM item_stock_ledger
       WHERE ($3::uuid IS NULL OR organization_id = $3::uuid)
     ),
     scoped_stock AS (
       SELECT organization_id, branch_id, item_id, stock, base_cost
       FROM item_branch_stock
       WHERE ($3::uuid IS NULL OR organization_id = $3::uuid)
     ),
     ledger_balances AS (
       SELECT organization_id, branch_id, item_id,
              SUM(net_quantity) AS total_ledger_units,
              SUM(net_quantity) FILTER (WHERE transaction_date <= $1::date - 1) AS opening_ledger_units,
              SUM(net_quantity) FILTER (WHERE transaction_date <= $2::date) AS closing_ledger_units
       FROM scoped_ledger
       GROUP BY organization_id, branch_id, item_id
     ),
     item_scope AS (
       SELECT organization_id, branch_id, item_id FROM scoped_stock
       UNION
       SELECT organization_id, branch_id, item_id FROM ledger_balances
     ),
     balances AS (
       SELECT scope.organization_id, scope.branch_id, scope.item_id,
              COALESCE(stock.stock, 0) - COALESCE(ledger.total_ledger_units, 0)
                + COALESCE(ledger.opening_ledger_units, 0) AS opening_units,
              COALESCE(stock.stock, 0) - COALESCE(ledger.total_ledger_units, 0)
                + COALESCE(ledger.closing_ledger_units, 0) AS closing_units,
              COALESCE(stock.base_cost, 0) AS base_cost
       FROM item_scope scope
       LEFT JOIN scoped_stock stock USING (organization_id, branch_id, item_id)
       LEFT JOIN ledger_balances ledger USING (organization_id, branch_id, item_id)
     ),
     opening_rates AS (
       SELECT DISTINCT ON (organization_id, branch_id, item_id)
              organization_id, branch_id, item_id, rate
       FROM scoped_ledger
       WHERE stock_type = 'Purchase' AND transaction_date <= $1::date - 1
       ORDER BY organization_id, branch_id, item_id, transaction_date DESC, created_at DESC
     ),
     closing_rates AS (
       SELECT DISTINCT ON (organization_id, branch_id, item_id)
              organization_id, branch_id, item_id, rate
       FROM scoped_ledger
       WHERE transaction_date <= $2::date
       ORDER BY organization_id, branch_id, item_id, transaction_date DESC, created_at DESC
     )
     SELECT
       COALESCE(SUM(b.opening_units), 0) AS "openingUnits",
       COALESCE(SUM(b.opening_units * COALESCE(orate.rate, b.base_cost)), 0) AS "openingAmount",
       COALESCE(SUM(b.closing_units), 0) AS "closingUnits",
       COALESCE(SUM(b.closing_units * COALESCE(crate.rate, b.base_cost)), 0) AS "closingAmount"
     FROM balances b
     LEFT JOIN opening_rates orate USING (organization_id, branch_id, item_id)
     LEFT JOIN closing_rates crate USING (organization_id, branch_id, item_id)`,
    [fromDate, toDate, organizationId],
  );

  const row = rows[0] ?? {};
  return {
    openingUnits: Number(row.openingUnits) || 0,
    openingAmount: Number(row.openingAmount) || 0,
    closingUnits: Number(row.closingUnits) || 0,
    closingAmount: Number(row.closingAmount) || 0,
  };
}
