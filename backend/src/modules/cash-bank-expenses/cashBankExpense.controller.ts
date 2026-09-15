import type { Request, Response } from 'express';
import { approveCashBankExpenseService, createCashBankExpenseService, deleteCashBankExpenseService, listCashBankExpensesService, updateCashBankExpenseService } from './cashBankExpense.service.js';

export async function listCashBankExpensesHandler(req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, data: await listCashBankExpensesService(req) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to load cash / bank expenses.' });
  }
}

export async function createCashBankExpenseHandler(req: Request, res: Response): Promise<void> {
  try {
    res.status(201).json({ success: true, data: await createCashBankExpenseService(req) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to save cash / bank expense.' });
  }
}

export async function updateCashBankExpenseHandler(req: Request, res: Response): Promise<void> {
  try { res.json({ success: true, data: await updateCashBankExpenseService(req) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message ?? 'Unable to update cash / bank expense.' }); }
}

export async function approveCashBankExpenseHandler(req: Request, res: Response): Promise<void> {
  try { res.json({ success: true, data: await approveCashBankExpenseService(req) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message ?? 'Unable to approve cash / bank expense.' }); }
}

export async function deleteCashBankExpenseHandler(req: Request, res: Response): Promise<void> {
  try { await deleteCashBankExpenseService(req); res.json({ success: true }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message ?? 'Unable to delete cash / bank expense.' }); }
}
