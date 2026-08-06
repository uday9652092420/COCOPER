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
 * GET Next Gunny Bag Code
 * GET /api/gunny-bags/next-code
 */
router.get("/next-code", getNextGunnyBagCodeHandler);

/**
 * GET All Gunny Bags
 * GET /api/gunny-bags
 */
router.get("/", listGunnyBagsHandler);

/**
 * GET Gunny Bag By Id
 * GET /api/gunny-bags/:id
 */
router.get("/:id", getGunnyBagHandler);

/**
 * Create Gunny Bag
 * POST /api/gunny-bags
 */
router.post("/", createGunnyBagHandler);

/**
 * Update Gunny Bag
 * PUT /api/gunny-bags/:id
 */
router.put("/:id", updateGunnyBagHandler);

/**
 * Delete Gunny Bag
 * DELETE /api/gunny-bags/:id
 */
router.delete("/:id", deleteGunnyBagHandler);

export default router;