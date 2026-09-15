import { pool } from '../../config/db.js';
import type { CashBankExpense, CreateCashBankExpenseInput } from './cashBankExpense.types.js';

const SELECT = `
  SELECT
    cbe.id,
    cbe.organization_id AS "organizationId",
    cbe.branch_id AS "branchId",
    b.branch_name AS branch,
    TO_CHAR(cbe.expense_date, 'YYYY-MM-DD') AS date,
    cbe.payment_mode AS "paymentMode",
    cbe.transaction_type AS "transactionType",
    cbe.amount,
    cbe.description,
    COALESCE(cbe.attachments, '[]'::jsonb) AS attachments,
    cbe.approved,
    TO_CHAR(cbe.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
  FROM cash_bank_expenses cbe
  INNER JOIN branches b ON b.id = cbe.branch_id AND b.organization_id = cbe.organization_id
`;

export async function listCashBankExpenses(organizationId: string): Promise<CashBankExpense[]> {
  const { rows } = await pool.query(
    `${SELECT}
     WHERE cbe.organization_id = $1
     ORDER BY cbe.expense_date DESC, cbe.created_at DESC`,
    [organizationId],
  );
  return rows;
}

export async function createCashBankExpense(
  organizationId: string,
  payload: CreateCashBankExpenseInput,
): Promise<CashBankExpense> {
  const id = `CBE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { rows } = await pool.query(
    `INSERT INTO cash_bank_expenses
      (id, organization_id, branch_id, expense_date, payment_mode, transaction_type, amount, description, attachments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      id,
      organizationId,
      payload.branchId,
      payload.date,
      payload.paymentMode,
      payload.transactionType,
      payload.amount,
      payload.description ?? '',
      JSON.stringify(payload.attachments ?? []),
    ],
  );

  const created = await pool.query(`${SELECT} WHERE cbe.id = $1 AND cbe.organization_id = $2`, [rows[0].id, organizationId]);
  return created.rows[0];
}

export async function updateCashBankExpense(
  id: string,
  organizationId: string,
  payload: CreateCashBankExpenseInput,
): Promise<CashBankExpense | null> {
  const result = await pool.query(
    `UPDATE cash_bank_expenses
     SET branch_id = $1, expense_date = $2, payment_mode = $3,
         transaction_type = $4, amount = $5, description = $6, attachments = $7, updated_at = NOW()
       WHERE id = $8 AND organization_id = $9 AND approved = FALSE
     RETURNING id`,
    [payload.branchId, payload.date, payload.paymentMode, payload.transactionType, payload.amount, payload.description ?? '', JSON.stringify(payload.attachments ?? []), id, organizationId],
  );
  if (!result.rowCount) return null;
  const updated = await pool.query(`${SELECT} WHERE cbe.id = $1 AND cbe.organization_id = $2`, [id, organizationId]);
  return updated.rows[0] ?? null;
}

export async function approveCashBankExpense(id: string, organizationId: string): Promise<CashBankExpense | null> {
  const result = await pool.query(
    `UPDATE cash_bank_expenses SET approved = TRUE, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND approved = FALSE
     RETURNING id`,
    [id, organizationId],
  );
  if (!result.rowCount) return null;
  const approved = await pool.query(`${SELECT} WHERE cbe.id = $1 AND cbe.organization_id = $2`, [id, organizationId]);
  return approved.rows[0] ?? null;
}

export async function deleteCashBankExpense(id: string, organizationId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM cash_bank_expenses WHERE id = $1 AND organization_id = $2 AND approved = FALSE',
    [id, organizationId],
  );
  return result.rowCount === 1;
}

export async function branchBelongsToOrganization(branchId: string, organizationId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM branches WHERE id = $1 AND organization_id = $2',
    [branchId, organizationId],
  );
  return rowCount === 1;
}
