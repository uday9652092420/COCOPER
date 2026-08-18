/**
 * @file gunnybag.validation.ts
 * @description Validation for Gunny Bag Master and Bharthi Types.
 */

import {
  GunnyBagCreateDTO,
  GunnyBagBharthiTypeCreateDTO,
} from "./gunnybag.types.js";

/**
 * ============================================================
 * Gunny Bag Master Validation
 * ============================================================
 */
export function validateGunnyBagPayload(
  payload: Partial<GunnyBagCreateDTO>
) {
  
  const errors: Record<string, string> = {};

  /**
   * Code
   */
  if (!payload.code?.trim()) {
    errors.code = "Gunny Bag code is required";
  }

  /**
   * Name
   */
  if (!payload.name?.trim()) {
    errors.name = "Gunny Bag name is required";
  }

  /**
   * Rate
   */
  if (
    payload.rate_per_bag === undefined ||
    payload.rate_per_bag === null ||
    Number.isNaN(Number(payload.rate_per_bag)) ||
    Number(payload.rate_per_bag) < 0
  ) {
    errors.rate_per_bag = "Rate per bag is required";
  }

  /**
   * Opening stock
   */
  if (
    payload.opening_stock !== undefined &&
    payload.opening_stock !== null &&
    (
      Number.isNaN(Number(payload.opening_stock)) ||
      Number(payload.opening_stock) < 0
    )
  ) {
    errors.opening_stock =
      "Opening stock cannot be negative";
  }

  /**
   * Status
   */
  if (
    payload.status !== undefined &&
    payload.status !== "Active" &&
    payload.status !== "Inactive"
  ) {
    errors.status = "Invalid status";
  }

  /**
   * Validate Bharthi rows.
   */
  if (payload.bharthi_types) {
    payload.bharthi_types.forEach(
      (
        item: GunnyBagBharthiTypeCreateDTO,
        index: number
      ) => {
        const childErrors =
          validateGunnyBagBharthiTypePayload(item);

        if (childErrors) {
          Object.entries(childErrors).forEach(
            ([key, message]) => {
              errors[`bharthi_types.${index}.${key}`] =
                message;
            }
          );
        }
      }
    );
  }

  return Object.keys(errors).length
    ? errors
    : null;
}

/**
 * ============================================================
 * Bharthi Type Validation
 * ============================================================
 *
 * Accepted:
 *
 * 200
 * 200-Bharthi
 *
 * Stored format:
 *
 * 200-Bharthi
 */
export function validateGunnyBagBharthiTypePayload(
  payload: Partial<GunnyBagBharthiTypeCreateDTO>
) {
  const errors: Record<string, string> = {};

  if (
    payload.bharthi === undefined ||
    payload.bharthi === null ||
    String(payload.bharthi).trim() === ""
  ) {
    errors.bharthi = "Bharthi is required";
  }

  if (
    payload.stock === undefined ||
    payload.stock === null ||
    Number.isNaN(Number(payload.stock))
  ) {
    errors.stock = "Stock is required";
  } else if (Number(payload.stock) < 0) {
    errors.stock = "Stock cannot be negative";
  }

  return Object.keys(errors).length
    ? errors
    : null;
}