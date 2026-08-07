/**
 * @file labourstaff.controller.ts
 * @description Controller layer for Labour Staff Master.
 */

import { Request, Response } from "express";

import {
  createLabourStaffService,
  updateLabourStaffService,
  deleteLabourStaffService,
  listLabourStaffService,
  getLabourStaffService,
} from "./labourstaff.service.js";

/**
 * Route Params
 */
interface IdParams {
  id: string;
}

/**
 * CREATE Labour
 *
 * POST /api/labour-staff
 */
export async function createLabourStaffHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const labour = await createLabourStaffService(req.body);

    res.status(201).json({
      success: true,
      message: "Labour created successfully",
      data: labour,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create labour",
      errors: error.errors ?? null,
    });
  }
}

/**
 * LIST Labour Staff
 *
 * GET /api/labour-staff
 */
export async function listLabourStaffHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const labours = await listLabourStaffService();

    res.status(200).json({
      success: true,
      data: labours,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch labour staff",
    });
  }
}

/**
 * GET Labour By Id
 *
 * GET /api/labour-staff/:id
 */
export async function getLabourStaffHandler(
  req: Request<IdParams>,
  res: Response
): Promise<void> {
  try {
    const labour = await getLabourStaffService(req.params.id);

    res.status(200).json({
      success: true,
      data: labour,
    });
  } catch (error: any) {
    res.status(error.status || 404).json({
      success: false,
      message: error.message || "Labour not found",
    });
  }
}

/**
 * UPDATE Labour
 *
 * PUT /api/labour-staff/:id
 */
export async function updateLabourStaffHandler(
  req: Request<IdParams>,
  res: Response
): Promise<void> {
  try {
    const labour = await updateLabourStaffService(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Labour updated successfully",
      data: labour,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update labour",
      errors: error.errors ?? null,
    });
  }
}

/**
 * DELETE Labour
 *
 * DELETE /api/labour-staff/:id
 */
export async function deleteLabourStaffHandler(
  req: Request<IdParams>,
  res: Response
): Promise<void> {
  try {
    const result = await deleteLabourStaffService(req.params.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete labour",
    });
  }
}