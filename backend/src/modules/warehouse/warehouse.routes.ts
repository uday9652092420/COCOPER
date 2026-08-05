import express from "express";
import {
  createWarehouseHandler,
  listWarehousesHandler,
  getWarehouseHandler,
  getNextWarehouseCodeHandler,
  updateWarehouseHandler, 
  deleteWarehouseHandler  // ✅ ADD THIS
  // ✅ ADD THIS
} from "./warehouse.controller.js";

const router = express.Router();

router.get("/next-code", getNextWarehouseCodeHandler);

router.get("/", listWarehousesHandler);
router.get("/:id", getWarehouseHandler);

router.post("/", createWarehouseHandler);
router.put("/:id", updateWarehouseHandler);
router.delete("/:id", deleteWarehouseHandler);


export default router;