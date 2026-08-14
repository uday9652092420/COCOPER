import { Item, ItemCreateDTO } from "./item.types.js";

import {
  createItemRepo,
  updateItemRepo,
  deleteItemRepo,
  listItemsRepo,
  getItemByIdRepo,
  getNextItemCodeRepo,
  checkItemUsageRepo,
} from "./item.repository.js";

/**
 * Create Item
 */
export async function createItem(
  payload: ItemCreateDTO
): Promise<Item> {
  // Business Rules
  payload.code = String(payload.code).trim();
  payload.name = String(payload.name).trim();
  payload.category = String(payload.category).trim();
  payload.uom = String(payload.uom).trim();

  return createItemRepo(payload);
}

/**
 * Update Item
 */
export async function updateItem(
  id: string,
  payload: ItemCreateDTO
): Promise<Item | null> {
  // Business Rules
  payload.code = String(payload.code).trim();
  payload.name = String(payload.name).trim();
  payload.category = String(payload.category).trim();
  payload.uom = String(payload.uom).trim();

  return updateItemRepo(id, payload);
}

/**
 * Delete Item
 */
export async function deleteItem(
  id: string
): Promise<{ message: string }> {
  // Check whether this item is used in any module
  const used = await checkItemUsageRepo(id);

  if (used.length > 0) {
    throw new Error(
      `Item is used in ${used.join(", ")}`
    );
  }

  return deleteItemRepo(id);
}

/**
 * Get Item By Id
 */
export async function getItemById(
  id: string
): Promise<Item | null> {
  return getItemByIdRepo(id);
}

/**
 * List All Items
 */
export async function listItems(organizationId?: string | null, branchId?: string | null): Promise<Item[]> {
  return listItemsRepo(organizationId ?? null, branchId ?? null);
}

/**
 * Generate Next Item Code
 */
export async function getNextItemCode(): Promise<string> {
  return getNextItemCodeRepo();
}