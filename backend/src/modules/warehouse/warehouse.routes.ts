import express from 'express';
import { createWarehouseHandler, listWarehousesHandler, getWarehouseHandler } from './warehouse.controller.js';

const router = express.Router();

router.get('/', listWarehousesHandler);
router.get('/:id', getWarehouseHandler);
router.post('/', createWarehouseHandler);

export default router;
