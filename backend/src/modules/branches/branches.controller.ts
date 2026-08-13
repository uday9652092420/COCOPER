/**
 * @file branches.controller.ts
 * @description Controller for the User Branches module.
 */

import type { NextFunction, Request, Response } from 'express';
import {
  createBranch as createBranchService,
  deleteBranch as deleteBranchService,
  getBranchById as getBranchByIdService,
  listBranches as listBranchesService,
  updateBranch as updateBranchService,
} from './branches.service.js';
import { AppError } from '../../utils/AppError.js';

interface BranchParams {
  id: string;
}

function resolveOrganizationId(req: Request): string | undefined {
  return (req.query.organizationId as string | undefined) || req.header('x-organization-id');
}

export async function listBranchesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listBranchesService(resolveOrganizationId(req));
    return res.status(200).json(rows);
  } catch (error) {
    return next(new AppError('Failed to list branches', 500, { cause: error }));
  }
}

export async function getBranchHandler(
  req: Request<BranchParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getBranchByIdService(req.params.id);
    if (!row) return next(new AppError('Branch not found', 404));
    return res.status(200).json(row);
  } catch (error) {
    return next(new AppError('Failed to retrieve branch', 500, { cause: error }));
  }
}

export async function createBranchHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body?.branch_name || String(req.body.branch_name).trim() === '') {
    return next(new AppError('Validation failed', 400, { errors: { branch_name: 'Branch name is required' } }));
  }

  try {
    const created = await createBranchService(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return next(new AppError('Failed to create branch', 500, { cause: error }));
  }
}

export async function updateBranchHandler(
  req: Request<BranchParams>,
  res: Response,
  next: NextFunction
) {
  if (!req.body?.branch_name || String(req.body.branch_name).trim() === '') {
    return next(new AppError('Validation failed', 400, { errors: { branch_name: 'Branch name is required' } }));
  }

  try {
    const updated = await updateBranchService(req.params.id, req.body);
    if (!updated) return next(new AppError('Branch not found', 404));
    return res.status(200).json(updated);
  } catch (error) {
    return next(new AppError('Failed to update branch', 500, { cause: error }));
  }
}

export async function deleteBranchHandler(
  req: Request<BranchParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const deleted = await deleteBranchService(req.params.id);
    if (!deleted) return next(new AppError('Branch not found', 404));
    return res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    return next(new AppError('Failed to delete branch', 500, { cause: error }));
  }
}
