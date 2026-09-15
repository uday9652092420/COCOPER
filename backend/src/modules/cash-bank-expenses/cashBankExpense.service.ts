import type { Request } from 'express';
import {
  branchBelongsToOrganization,
  approveCashBankExpense,
  createCashBankExpense,
  deleteCashBankExpense,
  listCashBankExpenses,
  updateCashBankExpense,
} from './cashBankExpense.repository.js';
import type { CashBankExpense, CreateCashBankExpenseInput } from './cashBankExpense.types.js';

function requireOrganizationId(req: Request): string {
  const organizationId = req.header('x-organization-id');
  if (!organizationId) throw new Error('Organization is required to access cash / bank expenses.');
  return organizationId;
}

export async function listCashBankExpensesService(req: Request): Promise<CashBankExpense[]> {
  return listCashBankExpenses(requireOrganizationId(req));
}

export async function createCashBankExpenseService(req: Request): Promise<CashBankExpense> {
  const organizationId = requireOrganizationId(req);
  const payload = req.body as CreateCashBankExpenseInput;

  validatePayload(payload);
  if (!await branchBelongsToOrganization(payload.branchId, organizationId)) {
    throw new Error('Selected branch does not belong to this organization.');
  }

  return createCashBankExpense(organizationId, {
    ...payload,
    amount: Number(payload.amount),
    description: payload.description?.trim() ?? '',
    attachments: payload.attachments ?? [],
  });
}

function validatePayload(payload: CreateCashBankExpenseInput): void {
  if (!payload.branchId || !payload.date) throw new Error('Branch and date are required.');
  if (!['Cash', 'Bank', 'UPI'].includes(payload.paymentMode)) throw new Error('Invalid payment mode.');
  if (!['Expenses', 'Income'].includes(payload.transactionType)) throw new Error('Invalid transaction type.');
  if (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0) throw new Error('Amount must be greater than zero.');
  if ((payload.attachments ?? []).length > 5) throw new Error('You can attach up to 5 files.');
  for (const attachment of payload.attachments ?? []) {
    if (!['image/png', 'image/jpeg', 'application/pdf'].includes(attachment.mimeType)) throw new Error('Only PNG, JPG, and PDF files are allowed.');
    if (!attachment.name || !attachment.data?.startsWith('data:')) throw new Error('Invalid attachment.');
  }
}

async function validatedPayload(req: Request): Promise<{ organizationId: string; payload: CreateCashBankExpenseInput }> {
  const organizationId = requireOrganizationId(req);
  const payload = req.body as CreateCashBankExpenseInput;
  validatePayload(payload);
  if (!await branchBelongsToOrganization(payload.branchId, organizationId)) throw new Error('Selected branch does not belong to this organization.');
  return { organizationId, payload: { ...payload, amount: Number(payload.amount), description: payload.description?.trim() ?? '', attachments: payload.attachments ?? [] } };
}

export async function updateCashBankExpenseService(req: Request): Promise<CashBankExpense> {
  const { organizationId, payload } = await validatedPayload(req);
  const updated = await updateCashBankExpense(String(req.params.id), organizationId, payload);
  if (!updated) throw new Error('Expense not found or already approved.');
  return updated;
}

export async function approveCashBankExpenseService(req: Request): Promise<CashBankExpense> {
  const organizationId = requireOrganizationId(req);
  const approved = await approveCashBankExpense(String(req.params.id), organizationId);
  if (!approved) throw new Error('Expense not found or already approved.');
  return approved;
}

export async function deleteCashBankExpenseService(req: Request): Promise<void> {
  const deleted = await deleteCashBankExpense(String(req.params.id), requireOrganizationId(req));
  if (!deleted) throw new Error('Expense not found or already approved.');
}
