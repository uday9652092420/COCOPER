import { Router } from 'express';
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

router.get('/', listCustomerReceiptsHandler);
router.get('/next-no', getNextCustomerReceiptNoHandler);
router.get('/customer/:customerId', getCustomerReceiptsByCustomerHandler);
router.post('/', createCustomerReceiptHandler);
router.put('/:id', updateCustomerReceiptHandler);
router.post('/:id/approve', approveCustomerReceiptHandler);
router.delete('/:id', deleteCustomerReceiptHandler);

export default router;
