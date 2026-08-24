/**
 * @file auth.routes.ts
 * @description Routes for application authentication.
 */

import express from 'express';
import { loginHandler, logoutHandler } from './auth.controller.js';

const router = express.Router();

router.post('/login', loginHandler);
router.post('/logout', logoutHandler);

export default router;
