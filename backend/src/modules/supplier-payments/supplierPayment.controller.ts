import type { Request, Response } from 'express';
import { pool } from '../../config/db.js';

function organizationId(req: Request): string | null {
  return (req.query.organizationId as string | undefined) || req.header('x-organization-id') || null;
}

function payload(req: Request) {
  return { ...req.body, organizationId: organizationId(req) };
}

async function syncSupplierInvoiceOutstandingAmounts(supplierId: string, orgId: string | null): Promise<void> {
  const invoicesResult = await pool.query(
    `SELECT id, grand_total
     FROM purchase_invoices
     WHERE supplier_id = $1 AND ($2::uuid IS NULL OR organization_id = $2)
     ORDER BY CASE
       WHEN invoice_date ~ '^\\d{2}/\\d{2}/\\d{4}$' THEN to_date(invoice_date, 'DD/MM/YYYY')
       ELSE NULL
     END NULLS LAST, created_at ASC, id ASC`,
    [supplierId, orgId]
  );
  if (!invoicesResult.rows.length) return;

  const paymentsResult = await pool.query(
    `SELECT purchase_invoice_id AS "purchaseInvoiceId", amount, invoice_mode AS "invoiceMode"
     FROM supplier_payments
     WHERE supplier_id = $1 AND ($2::uuid IS NULL OR organization_id = $2)`,
    [supplierId, orgId]
  );

  const paidByInvoice = new Map<string, number>();
  let remainingCumulative = 0;
  for (const payment of paymentsResult.rows) {
    const amount = Number(payment.amount ?? 0);
    if (payment.purchaseInvoiceId) {
      paidByInvoice.set(payment.purchaseInvoiceId, (paidByInvoice.get(payment.purchaseInvoiceId) ?? 0) + amount);
    } else if (payment.invoiceMode === 'Cumulative') {
      remainingCumulative += amount;
    }
  }

  for (const invoice of invoicesResult.rows) {
    const total = Math.max(0, Number(invoice.grand_total ?? 0));
    const directPaid = Math.max(0, Number(paidByInvoice.get(invoice.id) ?? 0));
    const directOutstanding = Math.max(0, total - directPaid);
    const cumulativeApplied = Math.min(remainingCumulative, directOutstanding);
    const outstanding = Math.max(0, directOutstanding - cumulativeApplied);
    remainingCumulative = Math.max(0, remainingCumulative - cumulativeApplied);

    await pool.query(
      `UPDATE purchase_invoices
       SET outstanding_amount = $1,
           supplier_payment_receipt_status = $2
       WHERE id = $3 AND ($4::uuid IS NULL OR organization_id = $4)`,
      [outstanding, outstanding <= 0, invoice.id, orgId]
    );
  }
}

export async function listSupplierPaymentsHandler(req: Request, res: Response) {
  try {
    const orgId = organizationId(req);
    const { rows } = await pool.query(
      `SELECT id, payment_number AS "paymentNumber", supplier_id AS "supplierId",
              supplier_name AS "supplierName", payment_date AS date,
              invoice_mode AS "invoiceMode", payment_mode AS "paymentMode",
              amount, purchase_invoice_id AS "purchaseInvoiceId", remarks,
              attachment_names AS "attachmentNames", attachment_files AS "attachmentFiles", approved,
              organization_id AS "organizationId", created_at AS "createdAt"
       FROM supplier_payments
       WHERE ($1::uuid IS NULL OR organization_id = $1)
       ORDER BY created_at DESC, payment_date DESC`,
      [orgId]
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to load supplier payments.' });
  }
}

export async function getNextSupplierPaymentNoHandler(req: Request, res: Response) {
  try {
    const orgId = organizationId(req);
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(CASE WHEN payment_number ~ '^SP-[0-9]+$'
        THEN CAST(SUBSTRING(payment_number FROM 4) AS INTEGER) ELSE 0 END), 0) + 1 AS next
       FROM supplier_payments WHERE ($1::uuid IS NULL OR organization_id = $1)`,
      [orgId]
    );
    res.json({ success: true, data: `SP-${String(rows[0].next).padStart(2, '0')}` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to generate payment number.' });
  }
}

export async function createSupplierPaymentHandler(req: Request, res: Response) {
  try {
    const data = payload(req);
    if (!data.supplierId || Number(data.amount) <= 0) throw new Error('Supplier and amount greater than zero are required.');
    const id = data.id ?? `SP-${Date.now()}`;
    const { rows } = await pool.query(
      `INSERT INTO supplier_payments
        (id, payment_number, supplier_id, supplier_name, payment_date, invoice_mode, payment_mode,
         amount, purchase_invoice_id, remarks, attachment_names, attachment_files, approved, organization_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,FALSE,$13)
       RETURNING id, payment_number AS "paymentNumber", supplier_id AS "supplierId", supplier_name AS "supplierName",
         payment_date AS date, invoice_mode AS "invoiceMode", payment_mode AS "paymentMode", amount,
         purchase_invoice_id AS "purchaseInvoiceId", remarks, attachment_names AS "attachmentNames", attachment_files AS "attachmentFiles", approved, organization_id AS "organizationId", created_at AS "createdAt"`,
      [id, data.paymentNumber, data.supplierId, data.supplierName ?? null, data.date ?? new Date(), data.invoiceMode ?? 'Invoice by Invoice', data.paymentMode ?? 'Cash', Number(data.amount), data.purchaseInvoiceId ?? null, data.remarks ?? null, data.attachmentNames ?? null, data.attachmentFiles ?? null, data.organizationId]
    );
    await syncSupplierInvoiceOutstandingAmounts(data.supplierId, data.organizationId);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to save supplier payment.' });
  }
}

export async function updateSupplierPaymentHandler(req: Request, res: Response) {
  try {
    const data = payload(req);
    if (Number(data.amount) <= 0) throw new Error('Amount must be greater than zero.');
    const existing = await pool.query(
      'SELECT supplier_id AS "supplierId", organization_id AS "organizationId" FROM supplier_payments WHERE id=$1',
      [req.params.id]
    );
    const oldSupplierId = existing.rows[0]?.supplierId;
    const oldOrganizationId = existing.rows[0]?.organizationId ?? null;
    const { rows } = await pool.query(
      `UPDATE supplier_payments SET payment_number=$2, supplier_id=$3, supplier_name=$4,
        payment_date=$5, invoice_mode=$6, payment_mode=$7, amount=$8, purchase_invoice_id=$9,
        remarks=$10, attachment_names=$11, attachment_files=$12
       WHERE id=$1 AND ($13::uuid IS NULL OR organization_id=$13)
       RETURNING id, payment_number AS "paymentNumber", supplier_id AS "supplierId", supplier_name AS "supplierName",
         payment_date AS date, invoice_mode AS "invoiceMode", payment_mode AS "paymentMode", amount,
         purchase_invoice_id AS "purchaseInvoiceId", remarks, attachment_names AS "attachmentNames", attachment_files AS "attachmentFiles", approved, organization_id AS "organizationId", created_at AS "createdAt"`,
      [req.params.id, data.paymentNumber, data.supplierId, data.supplierName ?? null, data.date, data.invoiceMode, data.paymentMode, Number(data.amount), data.purchaseInvoiceId ?? null, data.remarks ?? null, data.attachmentNames ?? null, data.attachmentFiles ?? null, data.organizationId]
    );
    if (!rows[0]) throw new Error('Supplier payment not found.');
    if (oldSupplierId) {
      await syncSupplierInvoiceOutstandingAmounts(oldSupplierId, oldOrganizationId);
    }
    await syncSupplierInvoiceOutstandingAmounts(data.supplierId, data.organizationId);
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to update supplier payment.' });
  }
}

export async function approveSupplierPaymentHandler(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `UPDATE supplier_payments SET approved=TRUE WHERE id=$1 AND ($2::uuid IS NULL OR organization_id=$2)
       RETURNING id, payment_number AS "paymentNumber", approved`,
      [req.params.id, organizationId(req)]
    );
    if (!rows[0]) throw new Error('Supplier payment not found.');
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to approve supplier payment.' });
  }
}

export async function deleteSupplierPaymentHandler(req: Request, res: Response) {
  try {
    const existing = await pool.query(
      'SELECT supplier_id AS "supplierId", organization_id AS "organizationId" FROM supplier_payments WHERE id=$1',
      [req.params.id]
    );
    const result = await pool.query(
      'DELETE FROM supplier_payments WHERE id=$1 AND ($2::uuid IS NULL OR organization_id=$2)',
      [req.params.id, organizationId(req)]
    );
    if (!result.rowCount) throw new Error('Supplier payment not found.');
    if (existing.rows[0]?.supplierId) {
      await syncSupplierInvoiceOutstandingAmounts(existing.rows[0].supplierId, existing.rows[0].organizationId ?? null);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to delete supplier payment.' });
  }
}
