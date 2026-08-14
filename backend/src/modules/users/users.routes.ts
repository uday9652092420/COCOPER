/**
 * @file users.routes.ts
 * @description Routes for the User Master module.
 */

import express from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  getPermissionOptionsHandler,
  getUserHandler,
  getUserPermissionsHandler,
  listUsersHandler,
  setUserPermissionsHandler,
  updateUserHandler,
} from './users.controller.js';

const router = express.Router();

router.get('/', listUsersHandler);
router.get('/permission-options', getPermissionOptionsHandler);
router.get('/:id', getUserHandler);
router.get('/:id/permissions', getUserPermissionsHandler);
router.put('/:id/permissions', setUserPermissionsHandler);
router.post('/', createUserHandler);
router.put('/:id', updateUserHandler);
router.delete('/:id', deleteUserHandler);

export default router;
