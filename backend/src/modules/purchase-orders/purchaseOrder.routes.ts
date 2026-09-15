/**
 * @file purchaseOrder.routes.ts
 * @description API routes for Purchase Order module.
 */

import express from "express";
import { requireModulePermission, requireModulePermissionForBody } from "../../middleware/modulePermission.js";
import {
  listPurchaseOrdersHandler,
  getPurchaseOrderHandler,
  createPurchaseOrderHandler,
  updatePurchaseOrderHandler,
  deletePurchaseOrderHandler,
} from "./purchaseOrder.controller.js";

const router = express.Router();

router.get("/", requireModulePermission("purchase-order", "read"), listPurchaseOrdersHandler);
router.get("/:id", requireModulePermission("purchase-order", "read"), getPurchaseOrderHandler);
router.post("/", requireModulePermission("purchase-order", "create"), createPurchaseOrderHandler);
router.put("/:id", requireModulePermissionForBody("purchase-order", (req) => req.body?.status === "Approved" ? "approve" : "edit"), updatePurchaseOrderHandler);
router.delete("/:id", requireModulePermission("purchase-order", "delete"), deletePurchaseOrderHandler);

export default router;
