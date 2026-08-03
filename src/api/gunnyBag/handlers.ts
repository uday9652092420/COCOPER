/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations for gunny bags.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type { GunnyBagCreatePayload, GunnyBagUpdatePayload, GunnyBag } from './types'
import { listGunnyBags, getGunnyBag, createGunnyBag, updateGunnyBag, deleteGunnyBag } from './dataStore'

/**
 * @function list
 * @description List all gunny bags.
 */
export const list = async (): Promise<GunnyBag[]> => {
  return listGunnyBags()
}

/**
 * @function getById
 * @description Get a single gunny bag by id.
 */
export const getById = async (id: string): Promise<GunnyBag | undefined> => {
  return getGunnyBag(id)
}

/**
 * @function add
 * @description Create a new gunny bag.
 */
export const add = async (payload: GunnyBagCreatePayload): Promise<GunnyBag> => {
  // Basic validation
  if (!payload.code || !payload.name) {
    throw new Error('code and name are required')
  }
  return createGunnyBag(payload)
}

/**
 * @function edit
 * @description Update an existing gunny bag.
 */
export const edit = async (id: string, payload: GunnyBagUpdatePayload): Promise<GunnyBag> => {
  return updateGunnyBag(id, payload)
}

/**
 * @function remove
 * @description Delete a gunny bag by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteGunnyBag(id)
}