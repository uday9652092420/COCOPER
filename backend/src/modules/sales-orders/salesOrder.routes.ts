/**
 * @file salesOrder.routes.ts
 * @description API routes for Sales Order module.
 */

import express from "express";
import {
  listSalesOrdersHandler,
  getSalesOrderHandler,
  createSalesOrderHandler,
  updateSalesOrderHandler,
  deleteSalesOrderHandler,
} from "./salesOrder.controller.js";

const router = express.Router();

router.get("/", listSalesOrdersHandler);
router.get("/:id", getSalesOrderHandler);
router.post("/", createSalesOrderHandler);
router.put("/:id", updateSalesOrderHandler);
router.delete("/:id", deleteSalesOrderHandler);

export default router;
