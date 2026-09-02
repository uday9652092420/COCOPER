import { pool } from '../../config/db.js';
import type { CreateCustomerReceiptInput, CustomerReceipt, UpdateCustomerReceiptInput } from './customerReceipt.types.js';

async function syncDirectSaleOutstandingAmounts(customerId: string, organizationId?: string | null): Promise<void> {
  const salesResult = await pool.query(
    `
      SELECT id, invoice_no, customer_id, total_amount, sale_date
      FROM direct_sales
      WHERE customer_id = $1 AND ($2::uuid IS NULL OR organization_id = $2)
      ORDER BY sale_date ASC, created_at ASC, id ASC
    `,
    [customerId, organizationId ?? null]
  );

  if (!salesResult.rows.length) return;

  const sales = salesResult.rows.map((row) => ({
    id: row.id,
    invoiceNo: row.invoice_no,
    totalAmount: Number(row.total_amount ?? 0),
  }));

  const receiptsResult = await pool.query(
    `
      SELECT invoice_no, amount, invoice_mode
      FROM customer_receipts
      WHERE customer_id = $1 AND ($2::uuid IS NULL OR organization_id = $2)
    `,
    [customerId, organizationId ?? null]
  );

  const paidByInvoice = new Map<string, number>();
  let cumulativeReceipts = 0;

  for (const row of receiptsResult.rows) {
    const amount = Number(row.amount ?? 0)
    if (row.invoice_no) {
      paidByInvoice.set(row.invoice_no, (paidByInvoice.get(row.invoice_no) ?? 0) + amount)
    } else if (row.invoice_mode === 'Cumulative') {
      cumulativeReceipts += amount
    }
  }

  let remainingCumulative = cumulativeReceipts

  for (const sale of sales) {
    const invoicePaid = sale.invoiceNo ? Number(paidByInvoice.get(sale.invoiceNo) ?? 0) : 0
    let outstandingAmount = Math.max(0, sale.totalAmount - invoicePaid)

    if (remainingCumulative > 0) {
      const applied = Math.min(remainingCumulative, outstandingAmount)
      outstandingAmount = Math.max(0, outstandingAmount - applied)
      remainingCumulative = Math.max(0, remainingCumulative - applied)
    }

    const fullyPaid = outstandingAmount <= 0

    await pool.query(
      `UPDATE direct_sales
       SET outstanding_amount = $1,
           customer_receipt_status = $2
       WHERE id = $3`,
      [outstandingAmount, fullyPaid, sale.id]
    );
  }
}

export async function listCustomerReceiptsRepo(organizationId?: string | null): Promise<CustomerReceipt[]> {
  const params: string[] = [];
  let where = '';

  if (organizationId) {
    params.push(organizationId);
    where = 'WHERE cr.organization_id = $1';
  }

  const { rows } = await pool.query(
    `
      SELECT
        cr.id,
        cr.receipt_no,
        cr.customer_id,
        c.name AS customer_name,
        TO_CHAR(cr.receipt_date, 'YYYY-MM-DD') AS receipt_date,
        cr.invoice_mode,
        cr.invoice_no,
        cr.amount,
        cr.payment_mode,
        cr.remarks,
        cr.approved,
        cr.organization_id,
        TO_CHAR(cr.created_at, 'YYYY-MM-DD') AS created_at
      FROM customer_receipts cr
      LEFT JOIN customers c ON c.id = cr.customer_id
      ${where}
      ORDER BY cr.receipt_date DESC, cr.created_at DESC, cr.receipt_no DESC
    `,
    params
  );

  return rows as CustomerReceipt[];
}

export async function getNextReceiptNoRepo(organizationId?: string | null): Promise<string> {
  const organizationClause = organizationId ? 'WHERE organization_id = $1' : 'WHERE organization_id IS NULL OR organization_id = $1';
  const params = organizationId ? [organizationId] : [];

  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM '([0-9]+)$') AS INTEGER)), 0) + 1 AS next_no
     FROM customer_receipts
     ${organizationClause}`,
    params
  );

  const nextNo = Number(rows[0]?.next_no ?? 1);
  return `RCP-${String(nextNo).padStart(2, '0')}`;
}

export async function getCustomerReceiptsByCustomerRepo(customerId: string, organizationId?: string | null): Promise<CustomerReceipt[]> {
  const params = organizationId ? [customerId, organizationId] : [customerId];
  const where = organizationId ? 'WHERE cr.customer_id = $1 AND cr.organization_id = $2' : 'WHERE cr.customer_id = $1';

  const { rows } = await pool.query(
    `
      SELECT
        cr.id,
        cr.receipt_no,
        cr.customer_id,
        c.name AS customer_name,
        TO_CHAR(cr.receipt_date, 'YYYY-MM-DD') AS receipt_date,
        cr.invoice_mode,
        cr.invoice_no,
        cr.amount,
        cr.payment_mode,
        cr.remarks,
        cr.approved,
        cr.organization_id
      FROM customer_receipts cr
      LEFT JOIN customers c ON c.id = cr.customer_id
      ${where}
      ORDER BY cr.receipt_date DESC, cr.receipt_no DESC
    `,
    params
  );

  return rows as CustomerReceipt[];
}

export async function createCustomerReceiptRepo(payload: CreateCustomerReceiptInput): Promise<CustomerReceipt> {
  const { rows } = await pool.query(
    `
      INSERT INTO customer_receipts (
        id,
        receipt_no,
        customer_id,
        customer_name,
        receipt_date,
        invoice_mode,
        invoice_no,
        amount,
        payment_mode,
        remarks,
        approved,
        attachment_names,
        attachment_files,
        organization_id,
        created_at
      )
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        (SELECT name FROM customers WHERE id = $2),
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        FALSE,
        $9,
        $10,
        $11,
        CURRENT_DATE
      )
      RETURNING
        id,
        receipt_no,
        customer_id,
        customer_name,
        TO_CHAR(receipt_date, 'YYYY-MM-DD') AS receipt_date,
        invoice_mode,
        invoice_no,
        amount,
        payment_mode,
        remarks,
        approved,
        attachment_names,
        attachment_files,
        organization_id,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at
    `,
    [
      payload.receipt_no,
      payload.customer_id,
      payload.receipt_date,
      payload.invoice_mode ?? 'Invoice by Invoice',
      payload.invoice_no ?? null,
      Number(payload.amount ?? 0),
      payload.payment_mode ?? 'Cash',
      payload.remarks ?? null,
      payload.attachment_names ?? null,
      payload.attachment_files ?? null,
      payload.organization_id ?? null,
    ]
  );

  const receipt = rows[0] as CustomerReceipt;
  if (receipt?.customer_id) {
    await syncDirectSaleOutstandingAmounts(receipt.customer_id, receipt.organization_id ?? null);
  }

  return receipt;
}

export async function updateCustomerReceiptRepo(id: string, payload: UpdateCustomerReceiptInput): Promise<CustomerReceipt | null> {
  const existing = await pool.query(
    'SELECT customer_id, organization_id FROM customer_receipts WHERE id = $1',
    [id]
  );

  const previousCustomerId = existing.rows[0]?.customer_id ?? null;
  const previousOrganizationId = existing.rows[0]?.organization_id ?? null;

  const { rows } = await pool.query(
    `
      UPDATE customer_receipts
      SET
        receipt_no = $1,
        customer_id = $2,
        customer_name = COALESCE((SELECT name FROM customers WHERE id = $2), customer_name),
        receipt_date = $3,
        invoice_mode = $4,
        invoice_no = $5,
        amount = $6,
        payment_mode = $7,
        remarks = $8,
        attachment_names = $9,
        attachment_files = $10
      WHERE id = $11
      RETURNING
        id,
        receipt_no,
        customer_id,
        customer_name,
        TO_CHAR(receipt_date, 'YYYY-MM-DD') AS receipt_date,
        invoice_mode,
        invoice_no,
        amount,
        payment_mode,
        remarks,
        attachment_names,
        attachment_files,
        organization_id,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at
    `,
    [
      payload.receipt_no,
      payload.customer_id,
      payload.receipt_date,
      payload.invoice_mode ?? 'Invoice by Invoice',
      payload.invoice_no ?? null,
      Number(payload.amount ?? 0),
      payload.payment_mode ?? 'Cash',
      payload.remarks ?? null,
      payload.attachment_names ?? null,
      payload.attachment_files ?? null,
      id,
    ]
  );

  const updated = rows[0] ?? null;

  if (updated?.customer_id) {
    await syncDirectSaleOutstandingAmounts(updated.customer_id, updated.organization_id ?? null);
  }

  if (previousCustomerId && previousCustomerId !== updated?.customer_id) {
    await syncDirectSaleOutstandingAmounts(previousCustomerId, previousOrganizationId ?? null);
  }

  return updated;
}

export async function deleteCustomerReceiptRepo(id: string, organizationId: string): Promise<void> {
  const existing = await pool.query(
    'SELECT customer_id, organization_id FROM customer_receipts WHERE id = $1 AND organization_id = $2',
    [id, organizationId]
  );

  const previousCustomerId = existing.rows[0]?.customer_id ?? null;
  const previousOrganizationId = existing.rows[0]?.organization_id ?? null;

  await pool.query('DELETE FROM customer_receipts WHERE id = $1 AND organization_id = $2', [id, organizationId]);

  if (previousCustomerId) {
    await syncDirectSaleOutstandingAmounts(previousCustomerId, previousOrganizationId ?? null);
  }
}

export async function approveCustomerReceiptRepo(id: string, organizationId?: string | null): Promise<CustomerReceipt | null> {
  const { rows } = await pool.query(
    `
      UPDATE customer_receipts
      SET approved = TRUE
      WHERE id = $1 AND ($2::uuid IS NULL OR organization_id = $2)
      RETURNING
        id,
        receipt_no,
        customer_id,
        customer_name,
        TO_CHAR(receipt_date, 'YYYY-MM-DD') AS receipt_date,
        invoice_mode,
        invoice_no,
        amount,
        payment_mode,
        remarks,
        approved,
        attachment_names,
        attachment_files,
        organization_id,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at
    `,
    [id, organizationId ?? null]
  );

  return (rows[0] as CustomerReceipt | undefined) ?? null;
}
