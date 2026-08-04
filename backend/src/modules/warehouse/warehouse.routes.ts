import express from "express";
import {
  createWarehouseHandler,
  listWarehousesHandler,
  getWarehouseHandler,
  getNextWarehouseCodeHandler,
} from "./warehouse.controller.js";

const router = express.Router();

// IMPORTANT: specific routes first
router.get("/next-code", getNextWarehouseCodeHandler);

// General routes
router.get("/", listWarehousesHandler);
router.get("/:id", getWarehouseHandler);
router.post("/", createWarehouseHandler);

export default router;