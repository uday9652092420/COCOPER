/**
 * @file labourstaff.validation.ts
 * @description Validation schemas for Labour Staff module.
 */

import { z } from "zod";

/**
 * Enums
 */
const genderEnum = z.enum(["Male", "Female"]);

const statusEnum = z.enum(["Active", "Inactive"]);

/**
 * Create Labour
 */
export const createLabourSchema = z.object({
  labour_name: z
    .string()
    .trim()
    .min(1, "Labour name is required")
    .max(100),

  gender: genderEnum,

  contact_number: z.string().trim(),

  address: z.string().trim(),

  in_time: z.string().trim(),

  out_time: z.string().trim(),

  overtime_5_8: z.coerce.number().min(0),

  overtime_6_8: z.coerce.number().min(0),

  overtime_7_8: z.coerce.number().min(0),

  overtime_7p_9p: z.coerce.number().min(0),

  overtime_7p_10p: z.coerce.number().min(0),

  loading_amount: z.coerce.number().min(0),

  status: statusEnum,

  organization_id: z
    .string()
    .nullable()
    .optional(),
});

/**
 * Update Labour
 */
export const updateLabourSchema = createLabourSchema.partial();

/**
 * Service uses this schema.
 */
export const labourStaffSchema = createLabourSchema;

/**
 * Route Param
 */
export const labourIdSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
});

/**
 * Types
 */
export type CreateLabourInput = z.infer<typeof createLabourSchema>;

export type UpdateLabourInput = z.infer<typeof updateLabourSchema>;

export type LabourIdInput = z.infer<typeof labourIdSchema>;