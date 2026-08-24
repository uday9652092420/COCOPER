/**
 * @file register.controller.ts
 * @description Controller for COCOPER ERP organization registration.
 */

import type {
  Request,
  Response,
} from "express";

import {
  registerOrganizationService,
} from "./register.service.js";

export async function registerOrganizationController(
  req: Request,
  res: Response
) {
  try {
    const result =
      await registerOrganizationService(
        req.body
      );

    return res.status(201).json({
      success: true,

      message:
        "Organization registered successfully.",

      organization:
        result.organization,

      user:
        result.user,
    });
  } catch (error: any) {
    console.error(
      "Organization registration error:",
      error
    );

    /**
     * Validation error.
     */
    if (
      error?.details?.errors
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Registration validation failed.",

        details:
          error.details,
      });
    }

    /**
     * Duplicate / business errors.
     */
    const message =
      error instanceof Error
        ? error.message
        : "Unable to register organization.";

    if (
      message.includes(
        "already exists"
      )
    ) {
      return res.status(409).json({
        success: false,

        message,
      });
    }

    /**
     * Database / unexpected error.
     */
    return res.status(500).json({
      success: false,

      message:
        "Unable to register organization.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? message
          : undefined,
    });
  }
}