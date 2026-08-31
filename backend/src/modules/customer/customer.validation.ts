/**
 * @file customer.validation.ts
 * @description Validation for Customer Master module.
 */

import { z } from "zod";

/**
 * Customer validation schema
 */
export const customerSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Customer code is required")
      .max(30, "Customer code is too long"),

    name: z
      .string()
      .trim()
      .min(1, "Customer name is required")
      .max(150, "Customer name is too long"),

    type: z.enum([
      "Premium",
      "Local",
      "Red",
    ]),

    state: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    address: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    mobile: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    whatsapp: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    contact_person: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    contact_person1: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    contact_no1: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    contact_person2: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    contact_no2: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    contact_person3: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    contact_no3: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    credit_limit: z
      .coerce
      .number()
      .min(0, "Credit Limit cannot be negative")
      .default(0),

    status: z.enum([
      "Active",
      "Inactive",
    ]),

    organization_id: z
      .string()
      .nullable()
      .optional(),
  })

  /**
   * Business Rule:
   * Red Customers are Cash Only.
   * Force Credit Limit = 0
   */
  .transform((data) => ({
    ...data,
    credit_limit:
      data.type === "Red"
        ? 0
        : data.credit_limit,
  }));

export type CustomerValidation =
  z.infer<typeof customerSchema>;