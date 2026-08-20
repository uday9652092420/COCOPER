/**
 * @file purchaseOrder.routes.ts
 * @description API routes for Purchase Order module.
 */

import express from "express";
import {
  listPurchaseOrdersHandler,
  getPurchaseOrderHandler,
  createPurchaseOrderHandler,
  updatePurchaseOrderHandler,
  deletePurchaseOrderHandler,
} from "./purchaseOrder.controller.js";

const router = express.Router();

router.get("/", listPurchaseOrdersHandler);
router.get("/:id", getPurchaseOrderHandler);
router.post("/", createPurchaseOrderHandler);
router.put("/:id", updatePurchaseOrderHandler);
router.delete("/:id", deletePurchaseOrderHandler);

export default router;
