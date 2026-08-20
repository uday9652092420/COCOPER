import { Item, ItemBranchStock, ItemBranchStockInput, ItemCreateDTO } from "./item.types.js";

import {
  createItemRepo,
  updateItemRepo,
  deleteItemRepo,
  listItemsRepo,
  getItemByIdRepo,
  getNextItemCodeRepo,
  checkItemUsageRepo,
  listItemBranchStockRepo,
  replaceItemBranchStockRepo,
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
 * List All Items (organization-scoped)
 */
export async function listItems(organizationId?: string | null): Promise<Item[]> {
  return listItemsRepo(organizationId ?? null);
}

/**
 * Generate Next Item Code (organization-scoped)
 */
export async function getNextItemCode(organizationId?: string | null): Promise<string> {
  return getNextItemCodeRepo(organizationId ?? null);
}

export async function listItemBranchStock(itemId: string, organizationId: string): Promise<ItemBranchStock[]> {
  return listItemBranchStockRepo(itemId, organizationId);
}

export async function replaceItemBranchStock(
  itemId: string,
  organizationId: string,
  itemCode: string,
  rows: ItemBranchStockInput[]
): Promise<ItemBranchStock[]> {
  return replaceItemBranchStockRepo(itemId, organizationId, itemCode, rows);
}