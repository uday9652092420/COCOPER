/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations for labours.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type { LabourCreatePayload, LabourUpdatePayload, Labour } from './types'
import { listLabours, getLabour, createLabour, updateLabour, deleteLabour } from './dataStore'

/**
 * @function list
 * @description List all labours.
 */
export const list = async (): Promise<Labour[]> => {
  return listLabours()
}

/**
 * @function getById
 * @description Get a single labour by id.
 */
export const getById = async (id: string): Promise<Labour | undefined> => {
  return getLabour(id)
}

/**
 * @function add
 * @description Create a new labour.
 */
export const add = async (payload: LabourCreatePayload): Promise<Labour> => {
  // Basic validation: name required
  if (!payload.labourName) {
    throw new Error('labourName is required')
  }
  return createLabour(payload)
}

/**
 * @function edit
 * @description Update an existing labour.
 */
export const edit = async (id: string, payload: LabourUpdatePayload): Promise<Labour> => {
  return updateLabour(id, payload)
}

/**
 * @function remove
 * @description Delete a labour by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteLabour(id)
}