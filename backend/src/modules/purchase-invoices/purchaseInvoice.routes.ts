/**
 * @file purchaseInvoice.routes.ts
 * @description API routes for Purchase Invoice module.
 */

import express from "express";
import {
  listPurchaseInvoicesHandler,
  getPurchaseInvoiceHandler,
  createPurchaseInvoiceHandler,
  updatePurchaseInvoiceHandler,
  deletePurchaseInvoiceHandler,
} from "./purchaseInvoice.controller.js";

const router = express.Router();

router.get("/", listPurchaseInvoicesHandler);
router.get("/:id", getPurchaseInvoiceHandler);
router.post("/", createPurchaseInvoiceHandler);
router.put("/:id", updatePurchaseInvoiceHandler);
router.delete("/:id", deletePurchaseInvoiceHandler);

export default router;
