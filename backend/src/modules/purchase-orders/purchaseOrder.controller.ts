/**
 * @file purchaseOrder.controller.ts
 * @description Controller layer for Purchase Order module.
 */

import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrderById,
} from "./purchaseOrder.service.js";

function resolveOrganizationId(req: Request): string | undefined {
  return (
    (req.query.organizationId as string | undefined) ||
    req.header("x-organization-id")
  );
}

export async function listPurchaseOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listPurchaseOrders(resolveOrganizationId(req));
    return res.status(200).json(rows);
  } catch (error) {
    return next(new AppError("Failed to list purchase orders", 500, { cause: error }));
  }
}

export async function getPurchaseOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getPurchaseOrderById(String(req.params.id));
    if (!row) {
      return next(new AppError("Purchase order not found", 404));
    }
    return res.status(200).json(row);
  } catch (error) {
    return next(new AppError("Failed to get purchase order", 500, { cause: error }));
  }
}

export async function createPurchaseOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = req.body;
    if (!payload.organizationId && resolveOrganizationId(req)) {
      payload.organizationId = resolveOrganizationId(req);
    }
    const created = await createPurchaseOrder(payload);
    return res.status(201).json(created);
  } catch (error) {
    return next(new AppError("Failed to create purchase order", 500, { cause: error }));
  }
}

export async function updatePurchaseOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const updated = await updatePurchaseOrder(String(req.params.id), req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return next(new AppError("Failed to update purchase order", 500, { cause: error }));
  }
}

export async function deletePurchaseOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deletePurchaseOrder(String(req.params.id));
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(new AppError("Failed to delete purchase order", 500, { cause: error }));
  }
}
