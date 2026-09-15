import { Router } from 'express';
import { requireModulePermission } from '../../middleware/modulePermission.js';
import {
  approveSupplierPaymentHandler,
  createSupplierPaymentHandler,
  deleteSupplierPaymentHandler,
  getNextSupplierPaymentNoHandler,
  listSupplierPaymentsHandler,
  updateSupplierPaymentHandler,
} from './supplierPayment.controller.js';

const router = Router();

router.get('/', requireModulePermission('supplier-payment', 'read'), listSupplierPaymentsHandler);
router.get('/next-no', requireModulePermission('supplier-payment', 'read'), getNextSupplierPaymentNoHandler);
router.post('/', requireModulePermission('supplier-payment', 'create'), createSupplierPaymentHandler);
router.put('/:id', requireModulePermission('supplier-payment', 'edit'), updateSupplierPaymentHandler);
router.post('/:id/approve', requireModulePermission('supplier-payment', 'approve'), approveSupplierPaymentHandler);
router.delete('/:id', requireModulePermission('supplier-payment', 'delete'), deleteSupplierPaymentHandler);

export default router;
