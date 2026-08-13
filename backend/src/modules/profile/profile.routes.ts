/**
 * @file profile.routes.ts
 * @description Routes for the current-user profile module.
 */

import express from 'express';
import {
  changePasswordHandler,
  getProfileHandler,
  updateProfileHandler,
} from './profile.controller.js';

const router = express.Router();

router.get('/me', getProfileHandler);
router.put('/me', updateProfileHandler);
router.put('/password', changePasswordHandler);

export default router;
