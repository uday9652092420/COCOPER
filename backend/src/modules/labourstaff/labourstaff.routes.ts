/**
 * @file labourstaff.routes.ts
 * @description API routes for Labour Staff Master.
 */

import express from "express";

import {
  createLabourStaffHandler,
  updateLabourStaffHandler,
  deleteLabourStaffHandler,
  listLabourStaffHandler,
  getLabourStaffHandler,
} from "./labourstaff.controller.js";

const router = express.Router();

/**
 * GET All Labour Staff
 *
 * GET /api/labour-staff
 */
router.get("/", listLabourStaffHandler);

/**
 * GET Labour By Id
 *
 * GET /api/labour-staff/:id
 */
router.get("/:id", getLabourStaffHandler);

/**
 * CREATE Labour
 *
 * POST /api/labour-staff
 */
router.post("/", createLabourStaffHandler);

/**
 * UPDATE Labour
 *
 * PUT /api/labour-staff/:id
 */
router.put("/:id", updateLabourStaffHandler);

/**
 * DELETE Labour
 *
 * DELETE /api/labour-staff/:id
 */
router.delete("/:id", deleteLabourStaffHandler);

export default router;