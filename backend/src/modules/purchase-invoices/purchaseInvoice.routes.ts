/**
 * @file purchaseInvoice.routes.ts
 * @description API routes for Purchase Invoice module.
 */

import express from "express";
import { requireModulePermission, requireModulePermissionForBody } from "../../middleware/modulePermission.js";
import {
  listPurchaseInvoicesHandler,
  getPurchaseInvoiceHandler,
  createPurchaseInvoiceHandler,
  updatePurchaseInvoiceHandler,
  deletePurchaseInvoiceHandler,
} from "./purchaseInvoice.controller.js";

const router = express.Router();

router.get("/", requireModulePermission("purchase-invoice", "read"), listPurchaseInvoicesHandler);
router.get("/:id", requireModulePermission("purchase-invoice", "read"), getPurchaseInvoiceHandler);
router.post("/", requireModulePermission("purchase-invoice", "create"), createPurchaseInvoiceHandler);
router.put("/:id", requireModulePermissionForBody("purchase-invoice", (req) => req.body?.status === "Approved" ? "approve" : "edit"), updatePurchaseInvoiceHandler);
router.delete("/:id", requireModulePermission("purchase-invoice", "delete"), deletePurchaseInvoiceHandler);

export default router;
