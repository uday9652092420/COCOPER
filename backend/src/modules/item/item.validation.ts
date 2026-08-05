import { ItemCreateDTO } from "./item.types.js";

export function validateItemPayload(
  payload: Partial<ItemCreateDTO>
) {
  const errors: Record<string, string> = {};

  if (!payload.code?.trim()) {
    errors.code = "Item code is required";
  }

  if (!payload.name?.trim()) {
    errors.name = "Item name is required";
  }

  if (!payload.category?.trim()) {
    errors.category = "Category is required";
  }

  if (!payload.uom?.trim()) {
    errors.uom = "UOM is required";
  }

  return Object.keys(errors).length ? errors : null;
}