import { pool } from '../../config/db.js';
import { approveCustomerReceiptRepo, createCustomerReceiptRepo, deleteCustomerReceiptRepo, getCustomerReceiptsByCustomerRepo, getNextReceiptNoRepo, listCustomerReceiptsRepo, updateCustomerReceiptRepo } from './customerReceipt.repository.js';
import type { CreateCustomerReceiptInput, CustomerReceipt, UpdateCustomerReceiptInput } from './customerReceipt.types.js';

function requireOrganizationId(req: any): string {
  const organizationId = req?.header?.('x-organization-id');
  if (!organizationId) {
    throw new Error('Organization is required to access customer receipts.');
  }
  return organizationId;
}

async function requireApprovedSalesInvoice(
  invoiceNo: string,
  customerId: string,
  organizationId: string,
): Promise<void> {
  const result = await pool.query(
    `SELECT id
     FROM direct_sales
     WHERE invoice_no = $1
       AND customer_id = $2
       AND organization_id = $3
       AND approved = TRUE`,
    [invoiceNo, customerId, organizationId],
  );

  if (!result.rows.length) {
    throw new Error('Only an approved sales invoice for the selected customer can be used.');
  }
}

export async function getCustomerReceiptsService(req: any): Promise<CustomerReceipt[]> {
  const organizationId = requireOrganizationId(req);
  return listCustomerReceiptsRepo(organizationId);
}

export async function getNextCustomerReceiptNoService(req: any): Promise<string> {
  const organizationId = requireOrganizationId(req);
  return getNextReceiptNoRepo(organizationId);
}

export async function createCustomerReceiptService(req: any): Promise<CustomerReceipt> {
  const payload = req.body as CreateCustomerReceiptInput;
  const organizationId = requireOrganizationId(req);

  if (!payload.customer_id) {
    throw new Error('Customer is required.');
  }

  if (!payload.amount || Number(payload.amount) <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  const finalPayload: CreateCustomerReceiptInput = {
    ...payload,
    organization_id: organizationId,
    invoice_mode: payload.invoice_mode ?? 'Invoice by Invoice',
    payment_mode: payload.payment_mode ?? 'Cash',
    invoice_no: payload.invoice_mode === 'Cumulative' ? null : (payload.invoice_no ?? null),
  };

  if (finalPayload.invoice_mode === 'Invoice by Invoice' && !finalPayload.invoice_no) {
    throw new Error('Invoice number is required when mode is Invoice by Invoice.');
  }

  if (finalPayload.invoice_mode === 'Invoice by Invoice') {
    await requireApprovedSalesInvoice(finalPayload.invoice_no!, payload.customer_id, organizationId);
  }

  const customerExists = await pool.query('SELECT id FROM customers WHERE id = $1 AND organization_id = $2', [payload.customer_id, organizationId]);
  if (!customerExists.rows.length) {
    throw new Error('Selected customer not found for this organization.');
  }

  return createCustomerReceiptRepo(finalPayload);
}

export async function updateCustomerReceiptService(req: any): Promise<CustomerReceipt> {
  const id = req.params.id;
  const payload = req.body as UpdateCustomerReceiptInput;
  const organizationId = requireOrganizationId(req);

  const existing = await pool.query('SELECT id FROM customer_receipts WHERE id = $1 AND organization_id = $2', [id, organizationId]);
  if (!existing.rows.length) {
    throw new Error('Receipt not found.');
  }

  const customerExists = await pool.query('SELECT id FROM customers WHERE id = $1 AND organization_id = $2', [payload.customer_id, organizationId]);
  if (!customerExists.rows.length) {
    throw new Error('Selected customer not found for this organization.');
  }

  const finalPayload: UpdateCustomerReceiptInput = {
    ...payload,
    organization_id: organizationId,
    invoice_mode: payload.invoice_mode ?? 'Invoice by Invoice',
    payment_mode: payload.payment_mode ?? 'Cash',
    invoice_no: payload.invoice_mode === 'Cumulative' ? null : (payload.invoice_no ?? null),
  };

  if (finalPayload.invoice_mode === 'Invoice by Invoice' && !finalPayload.invoice_no) {
    throw new Error('Invoice number is required when mode is Invoice by Invoice.');
  }

  if (finalPayload.invoice_mode === 'Invoice by Invoice') {
    await requireApprovedSalesInvoice(finalPayload.invoice_no!, payload.customer_id, organizationId);
  }

  const updated = await updateCustomerReceiptRepo(id, finalPayload);
  if (!updated) {
    throw new Error('Receipt could not be updated.');
  }

  return updated;
}

export async function deleteCustomerReceiptService(req: any): Promise<void> {
  const id = req.params.id;
  await deleteCustomerReceiptRepo(id, requireOrganizationId(req));
}

export async function approveCustomerReceiptService(req: any): Promise<CustomerReceipt> {
  const organizationId = requireOrganizationId(req);
  const receipt = await approveCustomerReceiptRepo(String(req.params.id), organizationId);
  if (!receipt) throw new Error('Customer receipt not found.');
  return receipt;
}

export async function getCustomerReceiptsByCustomerService(customerId: string, req: any): Promise<CustomerReceipt[]> {
  const organizationId = requireOrganizationId(req);
  return getCustomerReceiptsByCustomerRepo(customerId, organizationId);
}
