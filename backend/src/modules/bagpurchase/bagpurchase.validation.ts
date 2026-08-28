/**
 * @file bagpurchase.validation.ts
 * @description Validation for Bag Purchase payloads.
 */

import type {
  BagPurchaseCreatePayload,
  BagPurchaseLinePayload,
} from "./bagpurchase.types.js";

/**
 * ============================================================
 * Validate Bag Purchase Payload
 * ============================================================
 */
export function validateBagPurchasePayload(
  payload: BagPurchaseCreatePayload
): void {
  /**
   * Purchase data
   */
  if (!payload) {
    throw new Error(
      "Purchase data is required"
    );
  }

  /**
   * Purchase date
   */
  if (!payload.purchase_date) {
    throw new Error(
      "Purchase date is required"
    );
  }

  /**
   * Supplier
   */
  if (!payload.supplier_id) {
    throw new Error(
      "Supplier is required"
    );
  }

  if (!payload.organization_id) {
    throw new Error("Organization is required");
  }

  if (!payload.branch_id) {
    throw new Error("Branch is required");
  }

  /**
   * Lines
   */
  if (
    !Array.isArray(payload.lines) ||
    payload.lines.length === 0
  ) {
    throw new Error(
      "At least one purchase line is required"
    );
  }

  /**
   * Validate every purchase line
   */
  payload.lines.forEach(
    (
      line: BagPurchaseLinePayload,
      index: number
    ) => {
      const lineNumber =
        index + 1;

      /**
       * ======================================================
       * Gunny Bag
       *
       * Frontend/API field:
       *     gunny_bag_id
       *
       * Database field:
       *     bag_type_id
       *
       * We use gunny_bag_id at API level.
       * ======================================================
       */
      const gunnyBagId =
        line.gunny_bag_id ??
        line.bag_type_id;

      if (
        !gunnyBagId ||
        String(gunnyBagId).trim() === ""
      ) {
        throw new Error(
          `Gunny Bag is required for line ${lineNumber}`
        );
      }

      /**
       * ======================================================
       * Bharthi
       * ======================================================
       */
      if (
        line.bharthi !== undefined &&
        line.bharthi !== null &&
        line.bharthi !== ""
      ) {
        const bharthi =
          Number(line.bharthi);

        if (
          !Number.isFinite(bharthi) ||
          bharthi < 0
        ) {
          throw new Error(
            `Bharthi must be a valid non-negative number for line ${lineNumber}`
          );
        }
      }

      /**
       * ======================================================
       * Quantity
       * ======================================================
       */
      const quantity =
        Number(line.quantity);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          `Quantity must be greater than zero for line ${lineNumber}`
        );
      }

      /**
       * ======================================================
       * Rate
       * ======================================================
       */
      const rate =
        Number(line.rate);

      if (
        !Number.isFinite(rate) ||
        rate < 0
      ) {
        throw new Error(
          `Rate must be a valid non-negative number for line ${lineNumber}`
        );
      }
    }
  );
}