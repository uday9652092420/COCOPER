/**
 * @file salesOrder.controller.ts
 * @description Controller layer for Sales Order module.
 */

import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import {
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  listSalesOrders,
  getSalesOrderById,
} from "./salesOrder.service.js";

function resolveOrganizationId(req: Request): string | undefined {
  return (
    (req.query.organizationId as string | undefined) ||
    req.header("x-organization-id")
  );
}

export async function listSalesOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listSalesOrders(resolveOrganizationId(req));
    return res.status(200).json(rows);
  } catch (error) {
    return next(new AppError("Failed to list sales orders", 500, { cause: error }));
  }
}

export async function getSalesOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getSalesOrderById(String(req.params.id));
    if (!row) {
      return next(new AppError("Sales order not found", 404));
    }
    return res.status(200).json(row);
  } catch (error) {
    return next(new AppError("Failed to get sales order", 500, { cause: error }));
  }
}

export async function createSalesOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = req.body;
    if (!payload.organizationId && resolveOrganizationId(req)) {
      payload.organizationId = resolveOrganizationId(req);
    }
    const created = await createSalesOrder(payload);
    return res.status(201).json(created);
  } catch (error) {
    return next(new AppError("Failed to create sales order", 500, { cause: error }));
  }
}

export async function updateSalesOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const updated = await updateSalesOrder(String(req.params.id), req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return next(new AppError("Failed to update sales order", 500, { cause: error }));
  }
}

export async function deleteSalesOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteSalesOrder(String(req.params.id));
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(new AppError("Failed to delete sales order", 500, { cause: error }));
  }
}
