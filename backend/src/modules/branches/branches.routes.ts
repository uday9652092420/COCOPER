/**
 * @file branches.routes.ts
 * @description Routes for the User Branches module.
 */

import express from 'express';
import {
  createBranchHandler,
  deleteBranchHandler,
  getBranchHandler,
  getNextBranchCodeHandler,
  getUserBranchesHandler,
  listBranchesHandler,
  setUserBranchesHandler,
  updateBranchHandler,
} from './branches.controller.js';

const router = express.Router();

router.get('/', listBranchesHandler);
router.get('/next-code', getNextBranchCodeHandler);
router.get('/user-branches/:userId', getUserBranchesHandler);
router.put('/user-branches/:userId', setUserBranchesHandler);
router.get('/:id', getBranchHandler);
router.post('/', createBranchHandler);
router.put('/:id', updateBranchHandler);
router.delete('/:id', deleteBranchHandler);

export default router;
