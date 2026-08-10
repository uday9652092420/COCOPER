/**
 * @file gunnybag.controller.ts
 * @description Controller layer for Gunny Bag Master.
 *
 * Handles:
 * - Get next Gunny Bag code
 * - Create Gunny Bag
 * - List Gunny Bags
 * - Get Gunny Bag by ID
 * - Update Gunny Bag
 * - Delete Gunny Bag
 */

import { Request, Response } from "express";

import {
  createGunnyBagService,
  updateGunnyBagService,
  deleteGunnyBagService,
  listGunnyBagsService,
  getGunnyBagService,
  getNextGunnyBagCodeService,
} from "./gunnybag.service.js";

/**
 * --------------------------------------------------------------------------
 * Route Params
 * --------------------------------------------------------------------------
 */
interface IdParams {
  id: string;
}

/**
 * --------------------------------------------------------------------------
 * Get Next Gunny Bag Code
 * --------------------------------------------------------------------------
 *
 * GET /api/gunny-bags/next-code
 *
 * Example response:
 *
 * {
 *   success: true,
 *   data: "GB-004"
 * }
 */
export async function getNextGunnyBagCodeHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const code =
      await getNextGunnyBagCodeService();

    return res.status(200).json({
      success: true,
      data: code,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate next code",
    });
  }
}

/**
 * --------------------------------------------------------------------------
 * Create Gunny Bag
 * --------------------------------------------------------------------------
 *
 * POST /api/gunny-bags
 *
 * Request body can contain:
 *
 * {
 *   code: "GB-004",
 *   name: "Jute Bag",
 *   size: "25x40 cm",
 *   rate_per_bag: 45,
 *   opening_stock: 100,
 *   status: "Active",
 *
 *   bharthi_types: [
 *     {
 *       bharthi: "120",
 *       stock: 30
 *     },
 *     {
 *       bharthi: "150",
 *       stock: 20
 *     },
 *     {
 *       bharthi: "180",
 *       stock: 40
 *     },
 *     {
 *       bharthi: "200",
 *       stock: 10
 *     }
 *   ]
 * }
 *
 * Backend automatically generates:
 *
 * 120 -> B120
 * 150 -> B150
 * 180 -> B180
 * 200 -> B200
 */
export async function createGunnyBagHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const gunnyBag =
      await createGunnyBagService(
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "Gunny Bag created successfully",
      data: gunnyBag,
    });
  } catch (error: any) {
    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to create Gunny Bag",
      errors:
        error.errors ?? null,
    });
  }
}

/**
 * --------------------------------------------------------------------------
 * List Gunny Bags
 * --------------------------------------------------------------------------
 *
 * GET /api/gunny-bags
 *
 * Each Gunny Bag includes:
 *
 * bharthi_types: [...]
 */
export async function listGunnyBagsHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const gunnyBags =
      await listGunnyBagsService();

    return res.status(200).json({
      success: true,
      data: gunnyBags,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch Gunny Bags",
    });
  }
}

/**
 * --------------------------------------------------------------------------
 * Get Gunny Bag By Id
 * --------------------------------------------------------------------------
 *
 * GET /api/gunny-bags/:id
 *
 * Returns:
 *
 * Gunny Bag master
 * +
 * Bharthi child records
 */
export async function getGunnyBagHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const gunnyBag =
      await getGunnyBagService(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: gunnyBag,
    });
  } catch (error: any) {
    return res.status(
      error.status || 404
    ).json({
      success: false,
      message:
        error.message ||
        "Gunny Bag not found",
    });
  }
}

/**
 * --------------------------------------------------------------------------
 * Update Gunny Bag
 * --------------------------------------------------------------------------
 *
 * PUT /api/gunny-bags/:id
 *
 * Updates:
 * - Gunny Bag master
 * - Bharthi child grid
 *
 * The repository performs both operations
 * inside one transaction.
 */
export async function updateGunnyBagHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const gunnyBag =
      await updateGunnyBagService(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Gunny Bag updated successfully",
      data: gunnyBag,
    });
  } catch (error: any) {
    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to update Gunny Bag",
      errors:
        error.errors ?? null,
    });
  }
}

/**
 * --------------------------------------------------------------------------
 * Delete Gunny Bag
 * --------------------------------------------------------------------------
 *
 * DELETE /api/gunny-bags/:id
 *
 * Deletes:
 * - Bharthi child records
 * - Gunny Bag master record
 */
export async function deleteGunnyBagHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const result =
      await deleteGunnyBagService(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to delete Gunny Bag",
    });
  }
}