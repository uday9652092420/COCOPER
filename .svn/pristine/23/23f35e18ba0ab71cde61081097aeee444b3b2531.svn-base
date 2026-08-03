/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations. These can be used directly
 *              by frontend pages (e.g., ItemMasterPage) as mock API calls.
 *
 * Example:
 *  import * as ItemAPI from 'src/api/item/handlers'
 *  const list = await ItemAPI.list()
 */

import type { ItemCreatePayload, ItemUpdatePayload, Item } from './types'
import { listItems, getItem, createItem, updateItem, deleteItem } from './dataStore'

/**
 * @function list
 * @description List all items.
 */
export const list = async (): Promise<Item[]> => {
  return listItems()
}

/**
 * @function getById
 * @description Get a single item by id.
 */
export const getById = async (id: string): Promise<Item | undefined> => {
  return getItem(id)
}

/**
 * @function add
 * @description Create a new item.
 */
export const add = async (payload: ItemCreatePayload): Promise<Item> => {
  return createItem(payload)
}

/**
 * @function edit
 * @description Update an existing item.
 */
export const edit = async (id: string, payload: ItemUpdatePayload): Promise<Item> => {
  return updateItem(id, payload)
}

/**
 * @function remove
 * @description Delete an item by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteItem(id)
}