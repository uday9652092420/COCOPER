import express from "express";

import {
  createItemHandler,
  listItemsHandler,
  getItemHandler,
  getNextItemCodeHandler,
  updateItemHandler,
  deleteItemHandler,
  listItemStockHandler,
  replaceItemStockHandler,
} from "./item.controller.js";

const router = express.Router();

/**
 * Specific routes first
 */
router.get("/next-code", getNextItemCodeHandler);

/**
 * CRUD Routes
 */
router.get("/", listItemsHandler);

router.get("/:id/stock", listItemStockHandler);

router.put("/:id/stock", replaceItemStockHandler);

router.get("/:id", getItemHandler);

router.post("/", createItemHandler);

router.put("/:id", updateItemHandler);

router.delete("/:id", deleteItemHandler);

export default router;