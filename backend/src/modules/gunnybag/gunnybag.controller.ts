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
 * Route Params
 */
interface IdParams {
  id: string;
}

/**
 * Get Next Gunny Bag Code
 * GET /api/gunny-bags/next-code
 */
export async function getNextGunnyBagCodeHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const code = await getNextGunnyBagCodeService();

    return res.status(200).json({
      success: true,
      data: code,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate next code",
    });
  }
}

/**
 * Create Gunny Bag
 * POST /api/gunny-bags
 */
export async function createGunnyBagHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const gunnyBag = await createGunnyBagService(req.body);

    return res.status(201).json({
      success: true,
      message: "Gunny Bag created successfully",
      data: gunnyBag,
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create Gunny Bag",
      errors: error.errors ?? null,
    });
  }
}

/**
 * List Gunny Bags
 * GET /api/gunny-bags
 */
export async function listGunnyBagsHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const gunnyBags = await listGunnyBagsService();

    return res.status(200).json({
      success: true,
      data: gunnyBags,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch Gunny Bags",
    });
  }
}

/**
 * Get Gunny Bag By Id
 * GET /api/gunny-bags/:id
 */
export async function getGunnyBagHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const gunnyBag = await getGunnyBagService(req.params.id);

    return res.status(200).json({
      success: true,
      data: gunnyBag,
    });
  } catch (error: any) {
    return res.status(error.status || 404).json({
      success: false,
      message: error.message || "Gunny Bag not found",
    });
  }
}

/**
 * Update Gunny Bag
 * PUT /api/gunny-bags/:id
 */
export async function updateGunnyBagHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const gunnyBag = await updateGunnyBagService(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Gunny Bag updated successfully",
      data: gunnyBag,
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update Gunny Bag",
      errors: error.errors ?? null,
    });
  }
}

/**
 * Delete Gunny Bag
 * DELETE /api/gunny-bags/:id
 */
export async function deleteGunnyBagHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const result = await deleteGunnyBagService(req.params.id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete Gunny Bag",
    });
  }
}