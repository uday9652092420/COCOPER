/**
 * @file purchaseInvoice.controller.ts
 * @description Controller layer for Purchase Invoice module.
 */

import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import {
  createPurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
  listPurchaseInvoices,
  getPurchaseInvoiceById,
} from "./purchaseInvoice.service.js";

function resolveOrganizationId(req: Request): string | undefined {
  return (
    (req.query.organizationId as string | undefined) ||
    req.header("x-organization-id")
  );
}

export async function listPurchaseInvoicesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listPurchaseInvoices(resolveOrganizationId(req));
    return res.status(200).json(rows);
  } catch (error) {
    return next(new AppError("Failed to list purchase invoices", 500, { cause: error }));
  }
}

export async function getPurchaseInvoiceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getPurchaseInvoiceById(String(req.params.id));
    if (!row) {
      return next(new AppError("Purchase invoice not found", 404));
    }
    return res.status(200).json(row);
  } catch (error) {
    return next(new AppError("Failed to get purchase invoice", 500, { cause: error }));
  }
}

export async function createPurchaseInvoiceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = req.body;
    if (!payload.organizationId && resolveOrganizationId(req)) {
      payload.organizationId = resolveOrganizationId(req);
    }
    const created = await createPurchaseInvoice(payload);
    return res.status(201).json(created);
  } catch (error) {
    return next(new AppError("Failed to create purchase invoice", 500, { cause: error }));
  }
}

export async function updatePurchaseInvoiceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const updated = await updatePurchaseInvoice(String(req.params.id), req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return next(new AppError("Failed to update purchase invoice", 500, { cause: error }));
  }
}

export async function deletePurchaseInvoiceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deletePurchaseInvoice(String(req.params.id));
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(new AppError("Failed to delete purchase invoice", 500, { cause: error }));
  }
}
