import { Router } from 'express';
import { approveCashBankExpenseHandler, createCashBankExpenseHandler, deleteCashBankExpenseHandler, listCashBankExpensesHandler, updateCashBankExpenseHandler } from './cashBankExpense.controller.js';
import { requireModulePermission } from '../../middleware/modulePermission.js';

const router = Router();

router.get('/', requireModulePermission('cash-bank-expense', 'read'), listCashBankExpensesHandler);
router.post('/', requireModulePermission('cash-bank-expense', 'create'), createCashBankExpenseHandler);
router.put('/:id', requireModulePermission('cash-bank-expense', 'edit'), updateCashBankExpenseHandler);
router.post('/:id/approve', requireModulePermission('cash-bank-expense', 'approve'), approveCashBankExpenseHandler);
router.delete('/:id', requireModulePermission('cash-bank-expense', 'delete'), deleteCashBankExpenseHandler);

export default router;
