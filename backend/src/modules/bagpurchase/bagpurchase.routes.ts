
/**
 * @file bagpurchase.routes.ts
 * @description Routes for Bag Purchase module.
 */

import {
  Router,
} from "express";

import {
  getNextBagPurchaseNo,
  getBagPurchases,
  getBagPurchase,
  createBagPurchase,
  updateBagPurchase,
  deleteBagPurchase,
} from "./bagpurchase.controller.js";

const router =
  Router();

/**
 * ============================================================
 * Next Purchase Number
 * ============================================================
 *
 * GET /api/bag-purchases/next-number
 */
router.get(
  "/next-number",
  getNextBagPurchaseNo
);

/**
 * ============================================================
 * Get All Purchases
 * ============================================================
 *
 * GET /api/bag-purchases
 */
router.get(
  "/",
  getBagPurchases
);

/**
 * ============================================================
 * Get Purchase By ID
 * ============================================================
 *
 * GET /api/bag-purchases/:id
 */
router.get(
  "/:id",
  getBagPurchase
);

/**
 * ============================================================
 * Create Purchase
 * ============================================================
 *
 * POST /api/bag-purchases
 */
router.post(
  "/",
  createBagPurchase
);

/**
 * ============================================================
 * Update Purchase
 * ============================================================
 *
 * PUT /api/bag-purchases/:id
 */
router.put(
  "/:id",
  updateBagPurchase
);

/**
 * ============================================================
 * Delete Purchase
 * ============================================================
 *
 * DELETE /api/bag-purchases/:id
 */
router.delete(
  "/:id",
  deleteBagPurchase
);

export default router;
