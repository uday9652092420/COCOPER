/**
 * @file auth.routes.ts
 * @description Routes for application authentication.
 */

import express from 'express';
import { loginHandler } from './auth.controller.js';

const router = express.Router();

router.post('/login', loginHandler);

export default router;
