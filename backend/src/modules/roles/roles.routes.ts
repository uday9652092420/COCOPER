/**
 * @file roles.routes.ts
 * @description Routes for the Roles Master module.
 */

import express from 'express';
import {
  createRoleHandler,
  deleteRoleHandler,
  getRoleHandler,
  getRolePermissionsHandler,
  listPermissionsHandler,
  listRolesHandler,
  setRolePermissionsHandler,
  updateRoleHandler,
} from './roles.controller.js';

const router = express.Router();

router.get('/permissions', listPermissionsHandler);
router.get('/', listRolesHandler);
router.get('/:id', getRoleHandler);
router.get('/:id/permissions', getRolePermissionsHandler);
router.put('/:id/permissions', setRolePermissionsHandler);
router.post('/', createRoleHandler);
router.put('/:id', updateRoleHandler);
router.delete('/:id', deleteRoleHandler);

export default router;
