import { Router } from 'express';
import {
  approveSupplierPaymentHandler,
  createSupplierPaymentHandler,
  deleteSupplierPaymentHandler,
  getNextSupplierPaymentNoHandler,
  listSupplierPaymentsHandler,
  updateSupplierPaymentHandler,
} from './supplierPayment.controller.js';

const router = Router();

router.get('/', listSupplierPaymentsHandler);
router.get('/next-no', getNextSupplierPaymentNoHandler);
router.post('/', createSupplierPaymentHandler);
router.put('/:id', updateSupplierPaymentHandler);
router.post('/:id/approve', approveSupplierPaymentHandler);
router.delete('/:id', deleteSupplierPaymentHandler);

export default router;
