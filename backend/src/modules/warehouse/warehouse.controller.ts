import { NextFunction, Request, Response } from "express";
import {
  createWarehouse as createWarehouseService,
  listWarehouses as listWarehousesService,
  getWarehouseById as getWarehouseByIdService,
  getNextWarehouseCode,
} from "./warehouse.service.js";

import { validateWarehousePayload } from "./warehouse.validation.js";
import { AppError } from "../../utils/AppError.js";

interface WarehouseParams {
  id: string;
}

export async function createWarehouseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const payload = req.body;
  const errors = validateWarehousePayload(payload);

  if (errors) {
    return next(new AppError("Validation failed", 400, { errors }));
  }

  try {
    const created = await createWarehouseService(payload);
    return res.status(201).json(created);
  } catch (error) {
    return next(
      new AppError("Failed to create warehouse", 500, {
        cause: error,
      })
    );
  }
}

export async function listWarehousesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listWarehousesService();
    return res.json(rows);
  } catch (error) {
    return next(
      new AppError("Failed to list warehouses", 500, {
        cause: error,
      })
    );
  }
}

export async function getNextWarehouseCodeHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const code = await getNextWarehouseCode();

    return res.status(200).json({
      code,
    });
  } catch (error) {
    return next(
      new AppError("Failed to generate warehouse code", 500, {
        cause: error,
      })
    );
  }
}

export async function getWarehouseHandler(
  req: Request<WarehouseParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getWarehouseByIdService(req.params.id);

    if (!row) {
      return next(new AppError("Warehouse not found", 404));
    }

    return res.status(200).json(row);
  } catch (error) {
    return next(
      new AppError("Failed to retrieve warehouse", 500, {
        cause: error,
      })
    );
  }
}