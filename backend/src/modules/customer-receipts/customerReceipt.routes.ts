import { Router } from 'express';
import { requireModulePermission } from '../../middleware/modulePermission.js';
import {
  createCustomerReceiptHandler,
  deleteCustomerReceiptHandler,
  getCustomerReceiptsByCustomerHandler,
  getNextCustomerReceiptNoHandler,
  listCustomerReceiptsHandler,
  updateCustomerReceiptHandler,
  approveCustomerReceiptHandler,
} from './customerReceipt.controller.js';

const router = Router();

router.get('/', requireModulePermission('customer-receipt', 'read'), listCustomerReceiptsHandler);
router.get('/next-no', requireModulePermission('customer-receipt', 'read'), getNextCustomerReceiptNoHandler);
router.get('/customer/:customerId', requireModulePermission('customer-receipt', 'read'), getCustomerReceiptsByCustomerHandler);
router.post('/', requireModulePermission('customer-receipt', 'create'), createCustomerReceiptHandler);
router.put('/:id', requireModulePermission('customer-receipt', 'edit'), updateCustomerReceiptHandler);
router.post('/:id/approve', requireModulePermission('customer-receipt', 'approve'), approveCustomerReceiptHandler);
router.delete('/:id', requireModulePermission('customer-receipt', 'delete'), deleteCustomerReceiptHandler);

export default router;
