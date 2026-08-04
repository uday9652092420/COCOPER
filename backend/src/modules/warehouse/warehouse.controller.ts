import { NextFunction, Request, Response } from 'express';
import { createWarehouse as createWarehouseService, listWarehouses as listWarehousesService, getWarehouseById as getWarehouseByIdService } from './warehouse.service.js';
import { validateWarehousePayload } from './warehouse.validation.js';
import { AppError } from '../../utils/AppError.js';

interface WarehouseParams {
  id: string;
}

export async function createWarehouseHandler(req: Request, res: Response, next: NextFunction) {
  const payload = req.body;
  const errors = validateWarehousePayload(payload);
  if (errors) {
    return next(new AppError('Validation failed', 400, { errors }));
  }

  try {
    const created = await createWarehouseService(payload);
    return res.status(201).json(created);
  } catch (error: unknown) {
    return next(new AppError('Failed to create warehouse', 500, { cause: error }));
  }
}

export async function listWarehousesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await listWarehousesService();
    return res.json(rows);
  } catch (error: unknown) {
    return next(new AppError('Failed to list warehouses', 500, { cause: error }));
  }
}

export async function getWarehouseHandler(req: Request<WarehouseParams>, res: Response, next: NextFunction) {
  try {
    const row = await getWarehouseByIdService(req.params.id);
    if (!row) {
      return next(new AppError('Warehouse not found', 404));
    }
    return res.json(row);
  } catch (error: unknown) {
    return next(new AppError('Failed to retrieve warehouse', 500, { cause: error }));
  }
}
