/**
 * @file customer.controller.ts
 * @description Controller layer for Customer Master module.
 */

import { Request, Response } from "express";

import {
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
  listCustomersService,
  getCustomerService,
  getNextCustomerCodeService,
} from "./customer.service.js";

/**
 * Route Params
 */
interface IdParams {
  id: string;
}

function resolveOrganizationId(req: Request): string | undefined {
  return (
    (req.query.organizationId as string | undefined) ||
    req.header("x-organization-id")
  );
}

/**
 * GET Next Customer Code
 *
 * GET /api/customers/next-code
 */
export async function getNextCustomerCodeHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const code = await getNextCustomerCodeService(
      resolveOrganizationId(req)
    );

    return res.status(200).json({
      success: true,
      data: code,
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate customer code",
    });
  }
}

/**
 * CREATE Customer
 *
 * POST /api/customers
 */
export async function createCustomerHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const organizationId = requireOrganizationId(req);

    const customer = await createCustomerService(
      {
        ...req.body,
        organization_id: organizationId
      }
    );

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error: any) {
    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to create customer",
      errors: error.errors ?? null,
    });
  }
}

/**
 * LIST Customers
 *
 * GET /api/customers
 */
export async function listCustomersHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const customers =
      await listCustomersService(
        requireOrganizationId(req)
      );

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch customers",
    });
  }
}

/**
 * GET Customer By Id
 *
 * GET /api/customers/:id
 */
export async function getCustomerHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const customer =
      await getCustomerService(req.params.id, requireOrganizationId(req));

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    return res.status(
      error.status || 404
    ).json({
      success: false,
      message:
        error.message ||
        "Customer not found",
    });
  }
}

/**
 * UPDATE Customer
 *
 * PUT /api/customers/:id
 */
export async function updateCustomerHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const customer =
      await updateCustomerService(
        req.params.id,
        { ...req.body, organization_id: requireOrganizationId(req) },
        requireOrganizationId(req)
      );

    return res.status(200).json({
      success: true,
      message:
        "Customer updated successfully",
      data: customer,
    });
  } catch (error: any) {
    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to update customer",
      errors: error.errors ?? null,
    });
  }
}

/**
 * DELETE Customer
 *
 * DELETE /api/customers/:id
 */
export async function deleteCustomerHandler(
  req: Request<IdParams>,
  res: Response
): Promise<Response> {
  try {
    const result =
      await deleteCustomerService(req.params.id, requireOrganizationId(req));

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
        "Failed to delete customer",
    });
  }
}

function requireOrganizationId(req: Request<any>): string {
  const organizationId = resolveOrganizationId(req);
  if (!organizationId) throw { status: 400, message: "Organization ID is required" };
  return organizationId;
}