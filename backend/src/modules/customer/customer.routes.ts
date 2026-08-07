/**
 * @file customer.routes.ts
 * @description API routes for Customer Master module.
 */

import express from "express";

import {
  createCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
  listCustomersHandler,
  getCustomerHandler,
  getNextCustomerCodeHandler,
} from "./customer.controller.js";

const router = express.Router();

/**
 * GET Next Customer Code
 *
 * GET /api/customers/next-code
 *
 * Example:
 * CUST-001
 * CUST-002
 */
router.get(
  "/next-code",
  getNextCustomerCodeHandler
);

/**
 * GET All Customers
 *
 * GET /api/customers
 */
router.get(
  "/",
  listCustomersHandler
);

/**
 * GET Customer By Id
 *
 * GET /api/customers/:id
 */
router.get(
  "/:id",
  getCustomerHandler
);

/**
 * CREATE Customer
 *
 * POST /api/customers
 */
router.post(
  "/",
  createCustomerHandler
);

/**
 * UPDATE Customer
 *
 * PUT /api/customers/:id
 */
router.put(
  "/:id",
  updateCustomerHandler
);

/**
 * DELETE Customer
 *
 * DELETE /api/customers/:id
 */
router.delete(
  "/:id",
  deleteCustomerHandler
);

export default router;