import { NextFunction, Request, Response } from "express";

import {
  createItem as createItemService,
  updateItem as updateItemService,
  deleteItem as deleteItemService,
  listItems as listItemsService,
  getItemById as getItemByIdService,
  getNextItemCode,
  listItemBranchStock,
  replaceItemBranchStock,
} from "./item.service.js";

import { validateItemPayload } from "./item.validation.js";
import { AppError } from "../../utils/AppError.js";
import { pool } from "../../config/db.js";

interface ItemParams {
  id: string;
}

function resolveOrganizationId(req: Request<any>): string | undefined {
  return (
    (req.query.organizationId as string | undefined) ||
    req.header("x-organization-id")
  );
}

/**
 * Create Item
 */
export async function createItemHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const payload = req.body;

  const errors = validateItemPayload(payload);

  if (errors) {
    return next(
      new AppError("Validation failed", 400, {
        errors,
      })
    );
  }

  try {
    const organizationId = resolveOrganizationId(req);

    const created = await createItemService({
      ...payload,
      branch_wise_stock: payload.branch_wise_stock ?? payload.branchWiseStock ?? 0,
      organization_id: payload.organization_id ?? organizationId ?? null,
      // Items are organization-scoped (not branch-scoped) now.
      branch_id: null,
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(
      new AppError("Failed to create item", 500, {
        cause: error,
      })
    );
  }
}

/**
 * List Items
 */
export async function listItemsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listItemsService(resolveOrganizationId(req));

    return res.status(200).json(rows);
  } catch (error) {
    return next(
      new AppError("Failed to list items", 500, {
        cause: error,
      })
    );
  }
}

/**
 * Get Next Item Code
 */
export async function getNextItemCodeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const code = await getNextItemCode(resolveOrganizationId(req));

    return res.status(200).json({
      code,
    });
  } catch (error) {
    return next(
      new AppError("Failed to generate item code", 500, {
        cause: error,
      })
    );
  }
}

/**
 * Get Item By Id
 */
export async function getItemHandler(
  req: Request<ItemParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const item = await getItemByIdService(req.params.id);

    if (!item) {
      return next(new AppError("Item not found", 404));
    }

    return res.status(200).json(item);
  } catch (error) {
    return next(
      new AppError("Failed to retrieve item", 500, {
        cause: error,
      })
    );
  }
}

/**
 * Update Item
 */
export async function updateItemHandler(
  req: Request<ItemParams>,
  res: Response,
  next: NextFunction
) {
  const payload = req.body;

  const errors = validateItemPayload(payload);

  if (errors) {
    return next(
      new AppError("Validation failed", 400, {
        errors,
      })
    );
  }

  try {
    const updated = await updateItemService(
      req.params.id,
      { ...payload, branch_wise_stock: payload.branch_wise_stock ?? payload.branchWiseStock ?? 0 }
    );

    if (!updated) {
      return next(new AppError("Item not found", 404));
    }

    return res.status(200).json(updated);
  } catch (error) {
    return next(
      new AppError("Failed to update item", 500, {
        cause: error,
      })
    );
  }
}

/**
 * Delete Item
 */
export async function deleteItemHandler(
  req: Request<ItemParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await deleteItemService(req.params.id);

    return res.status(200).json(result);
  } catch (error: any) {
    if (
      error.message.includes("used in") ||
      error.message.includes("not found")
    ) {
      return next(new AppError(error.message, 400));
    }

    return next(
      new AppError("Failed to delete item", 500, {
        cause: error,
      })
    );
  }
}

export async function listItemStockHandler(
  req: Request<ItemParams>,
  res: Response,
  next: NextFunction
) {
  const organizationId = resolveOrganizationId(req);
  if (!organizationId) {
    return next(new AppError("Organization is required", 400));
  }
  try {
    const rows = await listItemBranchStock(req.params.id, organizationId);
    return res.status(200).json(rows);
  } catch (error) {
    return next(new AppError("Failed to load item branch stock", 500, { cause: error }));
  }
}

export async function replaceItemStockHandler(
  req: Request<ItemParams>,
  res: Response,
  next: NextFunction
) {
  const organizationId = resolveOrganizationId(req);
  if (!organizationId) {
    return next(new AppError("Organization is required", 400));
  }
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (rows.some((row: any) => !row.branch_id || Number(row.stock) < 0 || !Number.isFinite(Number(row.stock)))) {
    return next(new AppError("Each branch stock row requires a valid branch and non-negative stock", 400));
  }
  try {
    const itemResult = await pool.query(
      "SELECT id, code FROM items WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)",
      [req.params.id, organizationId]
    );
    const item = itemResult.rows[0];
    if (!item) return next(new AppError("Item not found", 404));

    const branchIds = rows.map((row: any) => row.branch_id);
    const branchResult = branchIds.length
      ? await pool.query(
          "SELECT id, branch_name FROM branches WHERE organization_id = $1 AND id = ANY($2::uuid[])",
          [organizationId, branchIds]
        )
      : { rows: [] };
    const branchMap = new Map(branchResult.rows.map((branch: any) => [branch.id, branch.branch_name]));
    if (branchMap.size !== new Set(branchIds).size) {
      return next(new AppError("Every selected branch must belong to the organization", 400));
    }
    const normalizedRows = rows.map((row: any) => ({
      branch_id: row.branch_id,
      branch_name: branchMap.get(row.branch_id),
      stock: Number(row.stock),
    }));
    const saved = await replaceItemBranchStock(req.params.id, organizationId, item.code, normalizedRows);
    return res.status(200).json(saved);
  } catch (error) {
    return next(new AppError("Failed to save item branch stock", 500, { cause: error }));
  }
}