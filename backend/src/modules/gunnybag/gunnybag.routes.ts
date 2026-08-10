/**
 * @file gunnybag.routes.ts
 * @description Routes for Gunny Bag Master.
 *
 * Handles:
 * - Gunny Bag CRUD
 * - Automatic Gunny Bag code generation
 * - Bharthi child records through Gunny Bag create/update
 */

import express from "express";

import {
  createGunnyBagHandler,
  updateGunnyBagHandler,
  deleteGunnyBagHandler,
  listGunnyBagsHandler,
  getGunnyBagHandler,
  getNextGunnyBagCodeHandler,
} from "./gunnybag.controller.js";

const router = express.Router();

/**
 * --------------------------------------------------------------------------
 * GET Next Gunny Bag Code
 * --------------------------------------------------------------------------
 *
 * GET /api/gunny-bags/next-code
 *
 * Example:
 * GB-001
 * GB-002
 * GB-003
 */
router.get(
  "/next-code",
  getNextGunnyBagCodeHandler
);

/**
 * --------------------------------------------------------------------------
 * GET All Gunny Bags
 * --------------------------------------------------------------------------
 *
 * GET /api/gunny-bags
 *
 * Response includes:
 *
 * Gunny Bag
 * +
 * bharthi_types[]
 */
router.get(
  "/",
  listGunnyBagsHandler
);

/**
 * --------------------------------------------------------------------------
 * GET Gunny Bag By Id
 * --------------------------------------------------------------------------
 *
 * GET /api/gunny-bags/:id
 *
 * Response includes:
 *
 * {
 *   ...gunnyBag,
 *   bharthi_types: [...]
 * }
 */
router.get(
  "/:id",
  getGunnyBagHandler
);

/**
 * --------------------------------------------------------------------------
 * CREATE Gunny Bag
 * --------------------------------------------------------------------------
 *
 * POST /api/gunny-bags
 *
 * Bharthi child records are submitted inside:
 *
 * bharthi_types: [
 *   {
 *     bharthi: "120",
 *     stock: 30
 *   }
 * ]
 *
 * Bharthi code is generated automatically by backend:
 *
 * 120 -> B120
 */
router.post(
  "/",
  createGunnyBagHandler
);

/**
 * --------------------------------------------------------------------------
 * UPDATE Gunny Bag
 * --------------------------------------------------------------------------
 *
 * PUT /api/gunny-bags/:id
 *
 * Updates:
 * - Gunny Bag master
 * - Bharthi child grid
 */
router.put(
  "/:id",
  updateGunnyBagHandler
);

/**
 * --------------------------------------------------------------------------
 * DELETE Gunny Bag
 * --------------------------------------------------------------------------
 *
 * DELETE /api/gunny-bags/:id
 *
 * Deletes the Gunny Bag and its Bharthi child records.
 */
router.delete(
  "/:id",
  deleteGunnyBagHandler
);

export default router;