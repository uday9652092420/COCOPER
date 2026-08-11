
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
      await getNextBagPurchaseNoService();

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
      await getBagPurchasesService();

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
    const data =
      await createBagPurchaseService(
        req.body
      );

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
        req.body
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
