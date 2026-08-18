import { NextFunction, Request, Response } from "express";

import {
  createItem as createItemService,
  updateItem as updateItemService,
  deleteItem as deleteItemService,
  listItems as listItemsService,
  getItemById as getItemByIdService,
  getNextItemCode,
} from "./item.service.js";

import { validateItemPayload } from "./item.validation.js";
import { AppError } from "../../utils/AppError.js";

interface ItemParams {
  id: string;
}

function resolveOrganizationId(req: Request): string | undefined {
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
      payload
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