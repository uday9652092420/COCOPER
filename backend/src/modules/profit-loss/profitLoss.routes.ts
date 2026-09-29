import { Router } from 'express';
import { requireModulePermission } from '../../middleware/modulePermission.js';
import { getProfitLossStockSnapshotHandler } from './profitLoss.controller.js';

const router = Router();
router.get('/stock-snapshot', requireModulePermission('profit-loss', 'read'), getProfitLossStockSnapshotHandler);

export default router;
