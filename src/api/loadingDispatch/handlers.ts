/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations for loading dispatches.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type {
  LoadingDispatch,
  LoadingDispatchCreatePayload,
  LoadingDispatchUpdatePayload,
} from './types'
import {
  listLoadingDispatches,
  getLoadingDispatch,
  createLoadingDispatch,
  updateLoadingDispatch,
  deleteLoadingDispatch,
} from './dataStore'

/**
 * @function list
 * @description List all loading dispatches.
 */
export const list = async (): Promise<LoadingDispatch[]> => {
  return listLoadingDispatches()
}

/**
 * @function getById
 * @description Get a single loading dispatch by id.
 */
export const getById = async (id: string): Promise<LoadingDispatch | undefined> => {
  return getLoadingDispatch(id)
}

/**
 * @function add
 * @description Create a new loading dispatch.
 */
export const add = async (payload: LoadingDispatchCreatePayload): Promise<LoadingDispatch> => {
  if (!payload.dispatchNo) throw new Error('dispatchNo is required')
  return createLoadingDispatch(payload)
}

/**
 * @function edit
 * @description Update an existing loading dispatch.
 */
export const edit = async (payload: LoadingDispatchUpdatePayload): Promise<LoadingDispatch> => {
  if (!payload.id) throw new Error('id is required for update')
  return updateLoadingDispatch(payload)
}

/**
 * @function remove
 * @description Delete a loading dispatch by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteLoadingDispatch(id)
}