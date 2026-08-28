
/**
 * @file bagpurchase.controller.ts
 * @description HTTP controllers for Bag Purchase module.
 */

import type {
  Request,
  Response,
} from "express";

import {
  getNextBagPurchaseNoService,
  getBagPurchasesService,
  getBagPurchaseService,
  createBagPurchaseService,
  updateBagPurchaseService,
  deleteBagPurchaseService,
} from "./bagpurchase.service.js";

function resolveOrganizationId(req: Request): string | undefined {
  return (
    (req.query.organizationId as string | undefined) ||
    req.header("x-organization-id")
  );
}

function resolveBranchId(req: Request): string | undefined {
  return (
    (req.query.branchId as string | undefined) ||
    req.header("x-branch-id")
  );
}

/**
 * ============================================================
 * Get Next Purchase Number
 * ============================================================
 */
export async function getNextBagPurchaseNo(
  req: Request,
  res: Response
) {
  try {
    const data =
      await getNextBagPurchaseNoService(resolveOrganizationId(req));

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(
      "Get next Bag Purchase number error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ??
        "Failed to generate purchase number",
    });
  }
}

/**
 * ============================================================
 * Get All Bag Purchases
 * ============================================================
 */
export async function getBagPurchases(
  req: Request,
  res: Response
) {
  try {
    const data =
      await getBagPurchasesService(
        resolveOrganizationId(req),
        resolveBranchId(req)
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(
      "Get Bag Purchases error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ??
        "Failed to load Bag Purchases",
    });
  }
}

/**
 * ============================================================
 * Get Single Bag Purchase
 * ============================================================
 */
export async function getBagPurchase(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Bag Purchase ID is required",
      });
    }

    const data =
      await getBagPurchaseService(id);

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(
      "Get Bag Purchase error:",
      error
    );

    const status =
      error?.message ===
      "Bag Purchase not found"
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      message:
        error?.message ??
        "Failed to load Bag Purchase",
    });
  }
}

/**
 * ============================================================
 * Create Bag Purchase
 * ============================================================
 */
export async function createBagPurchase(
  req: Request,
  res: Response
) {
  try {
    const organizationId =
      resolveOrganizationId(req);
    const branchId =
      resolveBranchId(req);

    const data =
      await createBagPurchaseService({
        ...req.body,
        organization_id:
          req.body.organization_id ??
          organizationId ??
          null,
        branch_id:
          req.body.branch_id ??
          branchId ??
          null,
      });

    return res.status(201).json({
      success: true,
      message:
        "Bag Purchase created successfully",
      data,
    });
  } catch (error: any) {
    console.error(
      "Create Bag Purchase error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error?.message ??
        "Failed to create Bag Purchase",
    });
  }
}

/**
 * ============================================================
 * Update Bag Purchase
 * ============================================================
 */
export async function updateBagPurchase(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Bag Purchase ID is required",
      });
    }

    const data =
      await updateBagPurchaseService(
        id,
        {
          ...req.body,
          organization_id: req.body.organization_id ?? resolveOrganizationId(req) ?? null,
          branch_id: req.body.branch_id ?? resolveBranchId(req) ?? null,
        }
      );

    return res.json({
      success: true,
      message:
        "Bag Purchase updated successfully",
      data,
    });
  } catch (error: any) {
    console.error(
      "Update Bag Purchase error:",
      error
    );

    const status =
      error?.message ===
      "Bag Purchase not found"
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message:
        error?.message ??
        "Failed to update Bag Purchase",
    });
  }
}

/**
 * ============================================================
 * Delete Bag Purchase
 * ============================================================
 */
export async function deleteBagPurchase(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Bag Purchase ID is required",
      });
    }

    const data =
      await deleteBagPurchaseService(id);

    return res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error(
      "Delete Bag Purchase error:",
      error
    );

    const status =
      error?.message ===
      "Bag Purchase not found"
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message:
        error?.message ??
        "Failed to delete Bag Purchase",
    });
  }
}
