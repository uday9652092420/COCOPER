/**
 * @file supplier.routes.ts
 * @description API routes for Supplier Master module.
 */


import express from "express";


import {

  createSupplierHandler,

  updateSupplierHandler,

  deleteSupplierHandler,

  listSuppliersHandler,

  getSupplierHandler,

  getNextSupplierCodeHandler,

} from "./supplier.controller.js";



const router = express.Router();





/**
 * GET Next Supplier Code
 *
 * GET /api/suppliers/next-code
 *
 * Example:
 * SUP-001
 * SUP-002
 */
router.get(
  "/next-code",
  getNextSupplierCodeHandler
);







/**
 * GET All Suppliers
 *
 * GET /api/suppliers
 */
router.get(
  "/",
  listSuppliersHandler
);







/**
 * GET Supplier By Id
 *
 * GET /api/suppliers/:id
 */
router.get(
  "/:id",
  getSupplierHandler
);







/**
 * CREATE Supplier
 *
 * POST /api/suppliers
 */
router.post(
  "/",
  createSupplierHandler
);







/**
 * UPDATE Supplier
 *
 * PUT /api/suppliers/:id
 */
router.put(
  "/:id",
  updateSupplierHandler
);







/**
 * DELETE Supplier
 *
 * DELETE /api/suppliers/:id
 */
router.delete(
  "/:id",
  deleteSupplierHandler
);



export default router;