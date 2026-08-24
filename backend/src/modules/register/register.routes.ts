/**
 * @file register.routes.js
 * @description Routes for COCOPER ERP SaaS registration.
 */

import express from "express";

import {
  registerOrganizationController,
} from "./register.controller.js";

const router = express.Router();

/**
 * POST
 *
 * /api/auth/register
 */
router.post(
  "/register",
  registerOrganizationController
);

export default router;